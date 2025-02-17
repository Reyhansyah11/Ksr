import { Op, Sequelize } from "sequelize";
import {
  Penjualan,
  PenjualanDetail,
  Toko,
  PembelianDetail,
  Pembelian,
  TokoProduct,
  Product,
  User,
  Pelanggan,
  Category,
} from "../models/index.js";
import TokoProductService from "../services/TokoProductService.js";
import sequelize from "../config/database.js";

class PenjualanController {
  constructor() {
    this.tokoProductService = new TokoProductService();
    // Bind methods
    this.createPenjualan = this.createPenjualan.bind(this);
    this.getDailySales = this.getDailySales.bind(this);
    this.getSalesReport = this.getSalesReport.bind(this);
    this.getPenjualanById = this.getPenjualanById.bind(this);
    this.getAllPenjualan = this.getAllPenjualan.bind(this);
  }

  // Create penjualan
  // Endpoint untuk membuat penjualan baru dengan fitur nomor faktur
  async createPenjualan(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const {
        pelanggan_id,
        products,
        bayar,
        no_faktur_manual, // Optional manual invoice number
      } = req.body;
      const toko_id = req.user.toko_id;
      const user_id = req.user.user_id;

      // Validasi input dasar
      if (
        !products ||
        !Array.isArray(products) ||
        products.length === 0 ||
        !bayar
      ) {
        return res.status(400).json({
          status: "error",
          message: "Produk dan jumlah bayar harus diisi",
        });
      }

      // Generate nomor faktur otomatis
      // Generate nomor faktur otomatis
      const generateNoFaktur = async () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        // Cari nomor faktur terakhir untuk toko ini di bulan ini
        const lastSale = await Penjualan.findOne({
          where: {
            toko_id,
            no_faktur: {
              [Op.like]: `INV/${year}/${month}/%`,
            },
          },
          order: [["createdAt", "DESC"]],
          transaction,
        });

        let sequence = 1;
        if (lastSale) {
          // Ambil nomor urut terakhir dari no_faktur
          const lastSequence = lastSale.no_faktur.split("/").pop();
          sequence = parseInt(lastSequence) + 1;
        }

        return `INV/${year}/${month}/${String(sequence).padStart(4, "0")}`;
      };

      // Tentukan nomor faktur
      const no_faktur = no_faktur_manual || (await generateNoFaktur());

      // Validasi nomor faktur unik
      const existingFaktur = await Penjualan.findOne({
        where: {
          no_faktur,
          toko_id,
        },
        transaction,
      });

      if (existingFaktur) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Nomor faktur sudah digunakan",
        });
      }

      // Validasi dan perhitungan produk
      let total = 0;
      let penjualanDetails = [];

      for (const item of products) {
        const { product_id, qty } = item;

        const tokoProduct = await TokoProduct.findOne({
          where: { toko_id, product_id },
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
          transaction,
        });

        if (!tokoProduct) {
          await transaction.rollback();
          return res.status(400).json({
            status: "error",
            message: `Produk dengan ID ${product_id} tidak tersedia di toko`,
          });
        }

        if (tokoProduct.stok < qty) {
          await transaction.rollback();
          return res.status(400).json({
            status: "error",
            message: `Stok tidak cukup untuk produk ID ${product_id}. Stok tersedia: ${tokoProduct.stok}`,
          });
        }

        const subtotal = qty * tokoProduct.harga_jual;
        total += subtotal;

        penjualanDetails.push({
          product_id,
          qty,
          harga_beli: tokoProduct.product.harga_beli,
          harga_jual: tokoProduct.harga_jual,
          subtotal,
        });
      }

      // Hitung diskon untuk member
      let diskon = 0;
      if (pelanggan_id) {
        // Update tanggal transaksi terakhir
        await Pelanggan.update(
          { last_transaction_date: new Date() },
          {
            where: { pelanggan_id },
            transaction,
          }
        );

        // Cek status member dan hitung diskon
        const pelanggan = await Pelanggan.findByPk(pelanggan_id, {
          transaction,
        });
        if (pelanggan && pelanggan.is_member) {
          if (total >= 1000000) diskon = 0.1; // 10% untuk >= 1jt
          else if (total >= 300000) diskon = 0.05; // 5% untuk >= 300rb
          else if (total >= 150000) diskon = 0.02; // 2% untuk >= 150rb
        }
      }

      const total_akhir = total - total * diskon;
      const sisa = bayar - total_akhir;

      // Validasi pembayaran
      if (bayar < total_akhir) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: `Pembayaran kurang. Total yang harus dibayar: ${total_akhir}`,
        });
      }

      // Buat penjualan
      const penjualan = await Penjualan.create(
        {
          toko_id,
          user_id,
          pelanggan_id,
          tanggal_penjualan: new Date(),
          total,
          diskon,
          total_akhir,
          bayar,
          sisa,
          no_faktur, // Tambahkan nomor faktur
        },
        { transaction }
      );

      // Buat detail penjualan dan update stok
      for (const detail of penjualanDetails) {
        await PenjualanDetail.create(
          {
            penjualan_id: penjualan.penjualan_id,
            ...detail,
          },
          { transaction }
        );

        // Kurangi stok
        await this.tokoProductService.updateStokAfterPenjualan(
          toko_id,
          detail.product_id,
          detail.qty,
          transaction
        );
      }

      // Commit transaksi
      await transaction.commit();

      // Get penjualan lengkap
      const penjualanLengkap = await Penjualan.findByPk(
        penjualan.penjualan_id,
        {
          include: [
            {
              model: PenjualanDetail,
              as: "details",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["product_name"],
                },
              ],
            },
            {
              model: Pelanggan,
              as: "pelanggan",
              attributes: ["nama_pelanggan", "is_member", "member_id"],
            },
            {
              model: User,
              as: "user",
              attributes: ["nama_lengkap"],
            },
          ],
        }
      );

      res.status(201).json({
        status: "success",
        message: "Penjualan berhasil",
        data: penjualanLengkap,
      });
    } catch (error) {
      // Rollback transaksi jika terjadi error
      if (transaction) await transaction.rollback();

      console.error(error);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get penjualan by ID
  async getPenjualanById(req, res) {
    try {
      const { id } = req.params;
      const toko_id = req.user.toko_id;

      const penjualan = await Penjualan.findOne({
        where: {
          penjualan_id: id,
          toko_id,
        },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member", "member_id"],
          },
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap"],
          },
        ],
      });

      if (!penjualan) {
        return res.status(404).json({
          status: "error",
          message: "Penjualan tidak ditemukan",
        });
      }

      res.json({
        status: "success",
        data: penjualan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get all penjualan
  async getAllPenjualan(req, res) {
    try {
      const toko_id = req.user.toko_id;

      const penjualan = await Penjualan.findAll({
        where: { toko_id },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member", "member_id"],
          },
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap"],
          },
        ],
        order: [["tanggal_penjualan", "DESC"]],
      });

      res.json({
        status: "success",
        data: penjualan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get daily sales report
  async getDailySales(req, res) {
    try {
      const toko_id = req.user.toko_id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sales = await Penjualan.findAll({
        where: {
          toko_id,
          tanggal_penjualan: {
            [Op.gte]: today,
          },
        },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name", "isi"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member"],
          },
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap"],
          },
        ],
      });

      const summary = sales.reduce(
        (acc, sale) => {
          acc.totalPenjualan += sale.total_akhir;
          sale.details.forEach((detail) => {
            acc.totalQty += detail.qty;
            // Hitung HPP per unit menggunakan isi dari product
            const hpp_per_unit = detail.harga_beli / detail.product.isi;
            acc.totalHPP += detail.qty * hpp_per_unit;
          });
          acc.totalLaba = acc.totalPenjualan - acc.totalHPP;
          return acc;
        },
        { totalQty: 0, totalPenjualan: 0, totalHPP: 0, totalLaba: 0 }
      );

      res.json({
        status: "success",
        data: {
          sales,
          summary,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get sales report with profit calculation
  async getSalesReport(req, res) {
    try {
      const toko_id = req.user.toko_id;
      let { startDate, endDate } = req.query;

      const sales = await Penjualan.findAll({
        where: {
          toko_id,
          tanggal_penjualan: {
            [Op.between]: [new Date(startDate), new Date(endDate)],
          },
        },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name", "isi"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member", "member_id"],
          },
        ],
        order: [["tanggal_penjualan", "ASC"]],
      });

      // Hitung total penjualan dan laba
      const summary = sales.reduce(
        (acc, sale) => {
          acc.totalPenjualan += sale.total_akhir;
          sale.details.forEach((detail) => {
            acc.totalQty += detail.qty;
            // HPP dihitung berdasarkan harga beli produk yang sebenarnya
            acc.totalHPP += detail.qty * detail.harga_beli; // harga_beli * qty per produk
          });
          // Laba dihitung sebagai total penjualan - total HPP
          acc.totalLaba = acc.totalPenjualan - acc.totalHPP;
          return acc;
        },
        { totalQty: 0, totalPenjualan: 0, totalHPP: 0, totalLaba: 0 }
      );

      res.json({
        status: "success",
        data: {
          sales,
          summary,
          periode: {
            startDate,
            endDate,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async getProfitLossReport(req, res) {
    try {
      const toko_id = req.user.toko_id;
      let { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          status: "error",
          message: "Tanggal awal dan akhir harus diisi",
        });
      }

      // Konversi ke format datetime dengan timezone yang tepat
      const startDateTime = new Date(startDate + "T00:00:00.000+07:00");
      const endDateTime = new Date(endDate + "T23:59:59.999+07:00");

      // Query data penjualan dengan join ke toko_product
      const salesData = await PenjualanDetail.findAll({
        attributes: [
          "product_id",
          [
            Sequelize.fn("SUM", Sequelize.col("penjualan_detail.qty")),
            "total_qty",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal(
                "penjualan_detail.qty * (toko_product.harga_beli / product.isi)"
              )
            ),
            "total_hpp",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal(
                "penjualan_detail.qty * toko_product.harga_jual"
              )
            ),
            "total_penjualan",
          ],
          [
            Sequelize.literal(
              "SUM(penjualan_detail.qty * toko_product.harga_jual) - SUM(penjualan_detail.qty * (toko_product.harga_beli / product.isi))"
            ),
            "laba",
          ],
        ],
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["product_name", "isi"],
            required: true,
            include: [
              {
                model: Category,
                as: "category",
                attributes: ["category_name"],
                required: true,
              },
            ],
          },
          {
            model: TokoProduct,
            as: "toko_product",
            attributes: [],
            required: true,
            where: { toko_id },
          },
          {
            model: Penjualan,
            as: "penjualan",
            attributes: [],
            required: true,
            where: {
              toko_id,
              tanggal_penjualan: {
                [Op.between]: [startDateTime, endDateTime],
              },
            },
          },
        ],
        group: [
          "penjualan_detail.product_id",
          "product.product_id",
          "product.category.category_id",
        ],
        having: Sequelize.literal("total_qty > 0"),
        order: [
          [Sequelize.col("product.category.category_name"), "ASC"],
          [Sequelize.col("product.product_name"), "ASC"],
        ],
        raw: true,
        nest: true,
      });

      // Format laporan
      const report = {
        detail_produk: salesData.map((item) => ({
          kategori: item.product.category.category_name,
          nama_produk: item.product.product_name,
          qty_terjual: parseInt(item.total_qty),
          total_hpp: parseInt(item.total_hpp),
          total_penjualan: parseInt(item.total_penjualan),
          laba: parseInt(item.laba),
          margin:
            (parseInt(item.total_hpp) > 0
              ? (
                  (parseInt(item.laba) / parseInt(item.total_hpp)) *
                  100
                ).toFixed(2)
              : 0) + "%",
        })),
        ringkasan: salesData.reduce(
          (acc, item) => {
            acc.total_qty += parseInt(item.total_qty);
            acc.total_hpp += parseInt(item.total_hpp);
            acc.total_penjualan += parseInt(item.total_penjualan);
            acc.total_laba += parseInt(item.laba);
            return acc;
          },
          {
            total_qty: 0,
            total_hpp: 0,
            total_penjualan: 0,
            total_laba: 0,
          }
        ),
        periode: {
          tanggal_mulai: startDateTime,
          tanggal_akhir: endDateTime,
        },
      };

      // Hitung margin rata-rata hanya jika ada total_hpp
      report.ringkasan.margin_rata_rata =
        report.ringkasan.total_hpp > 0
          ? (
              (report.ringkasan.total_laba / report.ringkasan.total_hpp) *
              100
            ).toFixed(2) + "%"
          : "0%";

      res.json({
        status: "success",
        data: report,
      });
    } catch (error) {
      console.error("Error in getProfitLossReport:", error);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Di dalam class PenjualanController

async getCombinedReport(req, res) {
  try {
    const toko_id = req.user.toko_id;
    let { startDate, endDate } = req.query;

    const startDateTime = new Date(startDate + 'T00:00:00.000+07:00');
    const endDateTime = new Date(endDate + 'T23:59:59.999+07:00');

    // 1. Get data pembelian (restock) with product information
    const purchaseData = await PembelianDetail.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('pembelian_detail.qty')), 'total_qty'],
        [Sequelize.literal('pembelian_detail.harga_beli'), 'harga_beli']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['product_name', 'isi'],
          required: true,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['category_name']
            }
          ]
        },
        {
          model: Pembelian,
          as: 'pembelian',
          attributes: [],
          where: {
            toko_id,
            tanggal_pembelian: {
              [Op.between]: [startDateTime, endDateTime]
            }
          }
        }
      ],
      group: [
        'product_id', 
        'product.product_id', 
        'product.category.category_id',
        'pembelian_detail.harga_beli'
      ],
      raw: true,
      nest: true
    });

    // 2. Get data penjualan
    const salesData = await PenjualanDetail.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('penjualan_detail.qty')), 'total_qty'],
        [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * penjualan_detail.harga_jual')), 'total_penjualan'],
        [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * (penjualan_detail.harga_beli / product.isi)')), 'total_hpp']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['product_name', 'isi'],
          required: true,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['category_name']
            }
          ]
        },
        {
          model: Penjualan,
          as: 'penjualan',
          attributes: [],
          where: {
            toko_id,
            tanggal_penjualan: {
              [Op.between]: [startDateTime, endDateTime]
            }
          }
        }
      ],
      group: [
        'product_id', 
        'product.product_id', 
        'product.category.category_id'
      ],
      raw: true,
      nest: true
    });

    // 3. Organize data per kategori with corrected calculations
    const categoryReport = {};

    // Process purchase data with dus calculation
    purchaseData.forEach(item => {
      const category = item.product.category.category_name;
      if (!categoryReport[category]) {
        categoryReport[category] = {
          pembelian: { qty: 0, total: 0 },
          penjualan: { qty: 0, total: 0 },
          hpp: 0,
          laba: 0,
          products: []
        };
      }

      const qtyPcs = parseInt(item.total_qty);
      const isiPerDus = item.product.isi;
      const hargaPerDus = parseFloat(item.harga_beli);
      const jumlahDus = Math.ceil(qtyPcs / isiPerDus);
      const totalPembelian = jumlahDus * hargaPerDus;

      categoryReport[category].pembelian.qty += qtyPcs;
      categoryReport[category].pembelian.total += totalPembelian;

      const existingProduct = categoryReport[category].products.find(
        p => p.nama_produk === item.product.product_name
      );

      if (existingProduct) {
        existingProduct.pembelian.qty += qtyPcs;
        existingProduct.pembelian.total += totalPembelian;
        existingProduct.pembelian.harga_satuan = hargaPerDus;
        existingProduct.pembelian.isi_per_dus = isiPerDus;
      } else {
        categoryReport[category].products.push({
          nama_produk: item.product.product_name,
          pembelian: {
            qty: qtyPcs,
            total: totalPembelian,
            harga_satuan: hargaPerDus,
            isi_per_dus: isiPerDus
          },
          penjualan: { qty: 0, total: 0 },
          hpp: 0,
          laba: 0
        });
      }
    });

    // Process sales data
    salesData.forEach(item => {
      const category = item.product.category.category_name;
      if (!categoryReport[category]) {
        categoryReport[category] = {
          pembelian: { qty: 0, total: 0 },
          penjualan: { qty: 0, total: 0 },
          hpp: 0,
          laba: 0,
          products: []
        };
      }

      const qtyPcs = parseInt(item.total_qty);
      const totalPenjualan = parseInt(item.total_penjualan);
      const totalHpp = parseInt(item.total_hpp);

      categoryReport[category].penjualan.qty += qtyPcs;
      categoryReport[category].penjualan.total += totalPenjualan;
      categoryReport[category].hpp += totalHpp;
      
      const existingProduct = categoryReport[category].products.find(
        p => p.nama_produk === item.product.product_name
      );

      if (existingProduct) {
        existingProduct.penjualan.qty = qtyPcs;
        existingProduct.penjualan.total = totalPenjualan;
        existingProduct.hpp = totalHpp;
        existingProduct.laba = totalPenjualan - totalHpp;
      } else {
        categoryReport[category].products.push({
          nama_produk: item.product.product_name,
          pembelian: { 
            qty: 0, 
            total: 0, 
            harga_satuan: 0,
            isi_per_dus: item.product.isi 
          },
          penjualan: { qty: qtyPcs, total: totalPenjualan },
          hpp: totalHpp,
          laba: totalPenjualan - totalHpp
        });
      }

      categoryReport[category].laba = 
        categoryReport[category].penjualan.total - categoryReport[category].hpp;
    });

    // 4. Calculate summary with corrected totals
    const ringkasan = {
      pembelian: {
        qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.pembelian.qty, 0),
        total: Object.values(categoryReport).reduce((sum, cat) => sum + cat.pembelian.total, 0)
      },
      penjualan: {
        qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.qty, 0),
        total: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.total, 0)
      },
      hpp: Object.values(categoryReport).reduce((sum, cat) => sum + cat.hpp, 0),
      laba: Object.values(categoryReport).reduce((sum, cat) => sum + cat.laba, 0)
    };

    // Calculate additional metrics
    ringkasan.margin = ringkasan.hpp > 0 
      ? ((ringkasan.laba / ringkasan.hpp) * 100).toFixed(2)
      : "0";

    ringkasan.selisih_pembelian_penjualan = 
      ringkasan.penjualan.total >= ringkasan.pembelian.total 
        ? "-" 
        : (ringkasan.pembelian.total - ringkasan.penjualan.total);

    ringkasan.persentase_pencapaian = ringkasan.pembelian.total > 0
      ? ((ringkasan.penjualan.total / ringkasan.pembelian.total) * 100).toFixed(2)
      : "-";

    res.json({
      status: "success",
      data: {
        detail_kategori: categoryReport,
        ringkasan,
        periode: {
          tanggal_mulai: startDateTime,
          tanggal_akhir: endDateTime
        }
      }
    });

  } catch (error) {
    console.error("Error in getCombinedReport:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
}

  // Tambahkan method baru di class PenjualanController

  // Get penjualan by user ID (untuk kasir)
  async getPenjualanByUserId(req, res) {
    try {
      const user_id = req.user.user_id;
      const toko_id = req.user.toko_id;

      const penjualan = await Penjualan.findAll({
        where: {
          user_id,
          toko_id,
        },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member", "member_id"],
          },
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap"],
          },
        ],
        order: [["tanggal_penjualan", "DESC"]],
      });

      res.json({
        status: "success",
        data: penjualan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get daily sales by user ID (untuk kasir)
  async getDailySalesByUserId(req, res) {
    try {
      const user_id = req.user.user_id;
      const toko_id = req.user.toko_id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sales = await Penjualan.findAll({
        where: {
          user_id,
          toko_id,
          tanggal_penjualan: {
            [Op.gte]: today,
          },
        },
        include: [
          {
            model: PenjualanDetail,
            as: "details",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_name", "isi"],
              },
            ],
          },
          {
            model: Pelanggan,
            as: "pelanggan",
            attributes: ["nama_pelanggan", "is_member"],
          },
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap"],
          },
        ],
      });

      const summary = sales.reduce(
        (acc, sale) => {
          acc.totalPenjualan += sale.total_akhir;
          sale.details.forEach((detail) => {
            acc.totalQty += detail.qty;
            const hpp_per_unit = detail.harga_beli / detail.product.isi;
            acc.totalHPP += detail.qty * hpp_per_unit;
          });
          acc.totalLaba = acc.totalPenjualan - acc.totalHPP;
          return acc;
        },
        { totalQty: 0, totalPenjualan: 0, totalHPP: 0, totalLaba: 0 }
      );

      res.json({
        status: "success",
        data: {
          sales,
          summary,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

export default PenjualanController;
