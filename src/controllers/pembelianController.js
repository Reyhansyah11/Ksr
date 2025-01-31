import { Op, Sequelize } from "sequelize";
import {
  Pembelian,
  Product,
  User,
  Toko,
  Supplier,
  PembelianDetail,
  TokoProduct,
} from "../models/index.js";
import TokoProductService from "../services/TokoProductService.js";

class PembelianController {
  constructor() {
    this.tokoProductService = new TokoProductService();
  }

  async generateNoFaktur() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const latestInvoice = await Pembelian.findOne({
      where: {
        no_faktur: {
          [Op.like]: `INV${year}${month}%`,
        },
      },
      order: [["no_faktur", "DESC"]],
    });

    let sequence = "00001";
    if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.no_faktur.slice(-5));
      sequence = String(lastSequence + 1).padStart(5, "0");
    }

    return `INV${year}${month}${sequence}`;
  }

  createPembelian = async (req, res) => {
    try {
      const { tanggal_pembelian, supplier_id, products, bayar } = req.body;

      // Ambil toko_id dan user_id dari user yang login
      const toko_id = req.user.toko_id;
      const user_id = req.user.user_id;

      let totalPembelian = 0;
      let pembelianDetails = [];

      if (!supplier_id || !products || !bayar) {
        return res.status(400).json({
          status: "error",
          message: "Supplier, produk, dan jumlah bayar harus diisi",
        });
      }

      const no_faktur = await this.generateNoFaktur();

      // Validasi dan persiapan detail pembelian
      for (const product of products) {
        const { product_id, jumlah_product } = product;

        const productData = await Product.findOne({
          where: {
            product_id,
            supplier_id, // Memastikan produk dari supplier yang dipilih
          },
        });

        if (!productData) {
          return res.status(400).json({
            status: "error",
            message: `Produk ID ${product_id} tidak tersedia dari supplier yang dipilih`,
          });
        }

        const totalHargaProduk = productData.harga_beli * jumlah_product;
        totalPembelian += totalHargaProduk;

        const qty = jumlah_product * productData.isi;

        // Hitung harga jual berdasarkan margin default (20%)
        const harga_beli_per_satuan = productData.harga_beli / productData.isi;
        const margin = 0.2 * harga_beli_per_satuan;
        const harga_jual = harga_beli_per_satuan + margin;

        pembelianDetails.push({
          product_id,
          qty,
          harga_beli: productData.harga_beli,
          harga_jual: harga_jual, // Menggunakan harga jual dari product
        });
      }

      const sisa = bayar - totalPembelian;

      // Buat pembelian
      const pembelian = await Pembelian.create({
        toko_id,
        user_id,
        no_faktur,
        tanggal_pembelian: tanggal_pembelian || new Date(),
        supplier_id,
        total: totalPembelian,
        bayar,
        sisa,
      });

      // Buat detail pembelian dan update stok
      for (const detail of pembelianDetails) {
        await PembelianDetail.create({
          pembelian_id: pembelian.pembelian_id,
          product_id: detail.product_id,
          qty: detail.qty,
          harga_beli: detail.harga_beli,
          harga_jual: detail.harga_jual,
        });

        // Update atau buat TokoProduct
        const [tokoProduct] = await TokoProduct.findOrCreate({
          where: {
            toko_id,
            product_id: detail.product_id,
          },
          defaults: {
            stok: 0,
            harga_jual: detail.harga_jual,
          },
        });

        await tokoProduct.increment("stok", { by: detail.qty });
      }

      // Ambil data pembelian lengkap
      const pembelianLengkap = await Pembelian.findByPk(
        pembelian.pembelian_id,
        {
          include: [
            {
              model: PembelianDetail,
              as: "details",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["product_name"],
                },
              ],
            },
          ],
        }
      );

      res.status(201).json({
        status: "success",
        message: "Pembelian berhasil dilakukan",
        data: pembelianLengkap,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  getWeeklyExpenses = async (req, res) => {
    try {
      const toko_id = req.user.toko_id;

      // Mendapatkan tanggal hari ini dengan zona waktu Asia/Jakarta
      const today = new Date();
      today.setHours(today.getHours()); // Menambah 7 jam untuk WIB

      // Set ke akhir hari ini (29 Januari 2025)
      const endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);

      // Hitung 6 hari ke belakang (mulai dari 23 Januari 2025)
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(endOfWeek.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);

      const weeklyExpenses = await Pembelian.findAll({
        attributes: [
          [Sequelize.fn("DATE", Sequelize.col("tanggal_pembelian")), "tanggal"],
          [Sequelize.fn("SUM", Sequelize.col("total")), "total_pengeluaran"],
        ],
        where: {
          toko_id,
          tanggal_pembelian: {
            [Op.between]: [startOfWeek, endOfWeek],
          },
        },
        group: [Sequelize.fn("DATE", Sequelize.col("tanggal_pembelian"))],
        order: [[Sequelize.col("tanggal"), "ASC"]],
      });

      // Generate array untuk 7 hari termasuk hari ini
      const completeWeekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(endOfWeek);
        date.setDate(endOfWeek.getDate() - i);

        const currentDateStr = date.toISOString().split("T")[0];
        const existingData = weeklyExpenses.find(
          (expense) => expense.getDataValue("tanggal") === currentDateStr
        );

        completeWeekData.push({
          tanggal: date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          total_pengeluaran: existingData
            ? parseFloat(existingData.getDataValue("total_pengeluaran")) || 0
            : 0,
        });
      }

      res.json({
        status: "success",
        data: completeWeekData,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  
  getExpenseReport = async (req, res) => {
    try {
      const toko_id = req.user.toko_id;
      let { startDate, endDate } = req.query;
  
      // Konversi startDate ke awal hari (00:00:00)
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
  
      // Konversi endDate ke akhir hari (23:59:59)
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
  
      console.log('Start Date:', startDateTime);
      console.log('End Date:', endDateTime);
  
      const expenses = await Pembelian.findAll({
        where: {
          toko_id,
          tanggal_pembelian: {
            [Op.between]: [startDateTime, endDateTime]
          }
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ['user_id', 'username', 'nama_lengkap']
          },
          {
            model: Supplier,
            as: "supplier",
            attributes: ['supplier_id', 'supplier_name']
          },
          {
            model: PembelianDetail,
            as: "details",
            include: [{
              model: Product,
              as: "product",
              attributes: ["product_name", "harga_beli"]
            }]
          }
        ],
        order: [["tanggal_pembelian", "ASC"]]
      });
  
      // Debug: tampilkan tanggal dari data yang ditemukan
      console.log('Found transactions:', expenses.map(e => ({
        id: e.pembelian_id,
        tanggal: e.tanggal_pembelian,
        total: e.total
      })));
  
      const totalExpense = expenses.reduce((sum, expense) => sum + expense.total, 0);
  
      res.json({
        status: "success",
        data: {
          expenses,
          totalExpense,
          periode: {
            startDate: startDateTime,
            endDate: endDateTime
          }
        }
      });
  
    } catch (error) {
      console.error('Error detail:', error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  };


  getPembelianById = async (req, res) => {
    try {
      const { id } = req.params;
      const toko_id = req.user.toko_id; // Ambil dari user yang login

      const pembelian = await Pembelian.findOne({
        where: {
          pembelian_id: id,
          toko_id, // Hanya bisa lihat pembelian toko sendiri
        },
        include: [
          {
            model: PembelianDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name", "harga_beli"],
              },
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["user_name"],
          },
        ],
      });

      if (!pembelian) {
        return res.status(404).json({
          status: "error",
          message: "Pembelian tidak ditemukan",
        });
      }

      res.json({
        status: "success",
        data: pembelian,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  getAllPembelian = async (req, res) => {
    try {
      const toko_id = req.user.toko_id; // Ambil dari user yang login

      const pembelian = await Pembelian.findAll({
        where: { toko_id }, // Hanya tampilkan pembelian toko sendiri
        include: [
          {
            model: PembelianDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name", "harga_beli"],
              },
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["user_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json({
        status: "success",
        data: pembelian,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };
}

export default PembelianController;
