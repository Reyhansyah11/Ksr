import { Pembelian, Product, SupplierProduct, User, Toko, PembelianDetail } from "../models/index.js";
class PembelianController {
    constructor() {
        this.createPembelian = this.createPembelian.bind(this);
        this.getPembelianById = this.getPembelianById.bind(this);
        this.getAllPembelian = this.getAllPembelian.bind(this);
    }

    // Fungsi untuk membuat transaksi pembelian baru
    createPembelian = async (req, res) => {
        try {
            const {
                toko_id,
                user_id,
                no_faktur,
                tanggal_pembelian,
                supplier_id,
                products, // Daftar produk yang dibeli
                bayar, // Jumlah yang sudah dibayar
            } = req.body;

            let totalPembelian = 0;
            let pembelianDetails = [];

            // Validasi input
            if (!toko_id || !user_id || !no_faktur || !supplier_id || !products || !bayar) {
                return res.status(400).json({
                    status: "error",
                    message: "Semua field harus diisi"
                });
            }

            // Menghitung total pembelian
            for (const product of products) {
                const { product_id, jumlah_product } = product;

                // Validasi apakah produk tersebut disuplai oleh supplier yang dipilih
                const isProductFromSupplier = await SupplierProduct.findOne({
                    where: {
                        supplier_id,
                        product_id,
                    }
                });

                if (!isProductFromSupplier) {
                    return res.status(400).json({
                        status: "error",
                        message: `Produk ID ${product_id} tidak tersedia dari supplier yang dipilih`,
                    });
                }

                // Ambil data produk untuk menghitung harga
                const productData = await Product.findByPk(product_id);
                const totalHargaProduk = productData.harga_beli * jumlah_product;

                // Tambahkan total pembelian
                totalPembelian += totalHargaProduk;

                // Menghitung qty berdasarkan jumlah produk yang dibeli dan isi per satuan produk
                const qty = jumlah_product * productData.isi;

                // Simpan detail pembelian untuk setiap produk
                pembelianDetails.push({
                    product_id,
                    qty,
                    harga_beli: productData.harga_beli,
                });
            }

            // Menghitung sisa pembayaran
            const sisa = bayar - totalPembelian;

            // Buat entri pembelian utama
            const pembelian = await Pembelian.create({
                toko_id,
                user_id,
                no_faktur,
                tanggal_pembelian,
                supplier_id,
                total: totalPembelian,
                bayar,
                sisa,
            });

            // Menyimpan semua detail pembelian
            for (const detail of pembelianDetails) {
                await PembelianDetail.create({
                    pembelian_id: pembelian.pembelian_id,
                    product_id: detail.product_id,
                    qty: detail.qty,
                    harga_beli: detail.harga_beli,
                });
            }

            res.status(201).json({
                status: "success",
                message: "Pembelian berhasil dilakukan",
                data: pembelian,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    }

    // Fungsi untuk mendapatkan pembelian berdasarkan ID
    getPembelianById = async (req, res) => {
        try {
            const { id } = req.params;
            const pembelian = await Pembelian.findOne({
                where: { pembelian_id: id },
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['product_name', 'harga_beli'],
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['user_name'],
                    },
                    {
                        model: Toko,
                        as: 'toko',
                        attributes: ['toko_name'],
                    }
                ]
            });

            if (!pembelian) {
                return res.status(404).json({
                    status: "error",
                    message: "Pembelian tidak ditemukan"
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
    }

    // Fungsi untuk mendapatkan semua pembelian
    getAllPembelian = async (req, res) => {
        try {
            const pembelian = await Pembelian.findAll({
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['product_name', 'harga_beli'],
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['user_name'],
                    },
                    {
                        model: Toko,
                        as: 'toko',
                        attributes: ['toko_name'],
                    }
                ]
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
    }
}

export default PembelianController;
