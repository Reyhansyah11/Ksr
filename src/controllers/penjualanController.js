import { Op, Sequelize } from "sequelize";
import {
    Penjualan,
    PenjualanDetail,
    TokoProduct,
    Product,
    User,
    Pelanggan
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
            no_faktur_manual // Optional manual invoice number
        } = req.body;
        const toko_id = req.user.toko_id;
        const user_id = req.user.user_id;

        // Validasi input dasar
        if (!products || !Array.isArray(products) || products.length === 0 || !bayar) {
            return res.status(400).json({
                status: "error",
                message: "Produk dan jumlah bayar harus diisi"
            });
        }

        // Generate nomor faktur otomatis
        const generateNoFaktur = async () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            
            // Cari nomor faktur terakhir untuk toko ini hari ini
            const lastSale = await Penjualan.findOne({
                where: {
                    toko_id,
                    tanggal_penjualan: {
                        [Op.gte]: new Date(today.setHours(0,0,0,0)),
                        [Op.lt]: new Date(today.setHours(23,59,59,999))
                    }
                },
                order: [['createdAt', 'DESC']],
                transaction
            });

            const sequence = lastSale 
                ? parseInt(lastSale.no_faktur.split('/').pop()) + 1 
                : 1;

            return `INV/${year}/${month}/${String(sequence).padStart(4, '0')}`;
        };

        // Tentukan nomor faktur
        const no_faktur = no_faktur_manual || await generateNoFaktur();

        // Validasi nomor faktur unik
        const existingFaktur = await Penjualan.findOne({
            where: { 
                no_faktur,
                toko_id 
            },
            transaction
        });

        if (existingFaktur) {
            await transaction.rollback();
            return res.status(400).json({
                status: "error",
                message: "Nomor faktur sudah digunakan"
            });
        }

        // Validasi dan perhitungan produk
        let total = 0;
        let penjualanDetails = [];

        for (const item of products) {
            const { product_id, qty } = item;

            const tokoProduct = await TokoProduct.findOne({
                where: { toko_id, product_id },
                include: [{
                    model: Product,
                    as: 'product'
                }],
                transaction
            });

            if (!tokoProduct) {
                await transaction.rollback();
                return res.status(400).json({
                    status: "error",
                    message: `Produk dengan ID ${product_id} tidak tersedia di toko`
                });
            }

            if (tokoProduct.stok < qty) {
                await transaction.rollback();
                return res.status(400).json({
                    status: "error",
                    message: `Stok tidak cukup untuk produk ID ${product_id}. Stok tersedia: ${tokoProduct.stok}`
                });
            }

            const subtotal = qty * tokoProduct.harga_jual;
            total += subtotal;

            penjualanDetails.push({
                product_id,
                qty,
                harga_beli: tokoProduct.product.harga_beli,
                harga_jual: tokoProduct.harga_jual,
                subtotal
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
                    transaction 
                }
            );
            
            // Cek status member dan hitung diskon
            const pelanggan = await Pelanggan.findByPk(pelanggan_id, { transaction });
            if (pelanggan && pelanggan.is_member) {
                if (total >= 1000000) diskon = 0.10;      // 10% untuk >= 1jt
                else if (total >= 300000) diskon = 0.05;  // 5% untuk >= 300rb
                else if (total >= 150000) diskon = 0.02;  // 2% untuk >= 150rb
            }
        }

        const total_akhir = total - (total * diskon);
        const sisa = bayar - total_akhir;

        // Validasi pembayaran
        if (bayar < total_akhir) {
            await transaction.rollback();
            return res.status(400).json({
                status: "error",
                message: `Pembayaran kurang. Total yang harus dibayar: ${total_akhir}`
            });
        }

        // Buat penjualan
        const penjualan = await Penjualan.create({
            toko_id,
            user_id,
            pelanggan_id,
            tanggal_penjualan: new Date(),
            total,
            diskon,
            total_akhir,
            bayar,
            sisa,
            no_faktur  // Tambahkan nomor faktur
        }, { transaction });

        // Buat detail penjualan dan update stok
        for (const detail of penjualanDetails) {
            await PenjualanDetail.create({
                penjualan_id: penjualan.penjualan_id,
                ...detail
            }, { transaction });

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
                                attributes: ["product_name"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member", "member_id"]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["nama_lengkap"]
                    }
                ]
            }
        );

        res.status(201).json({
            status: "success",
            message: "Penjualan berhasil",
            data: penjualanLengkap
        });

    } catch (error) {
        // Rollback transaksi jika terjadi error
        if (transaction) await transaction.rollback();

        console.error(error);
        res.status(500).json({
            status: "error",
            message: error.message
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
                    toko_id
                },
                include: [
                    {
                        model: PenjualanDetail,
                        as: "details",
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["product_name"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member", "member_id"]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["nama_lengkap"]
                    }
                ]
            });

            if (!penjualan) {
                return res.status(404).json({
                    status: "error",
                    message: "Penjualan tidak ditemukan"
                });
            }

            res.json({
                status: "success",
                data: penjualan
            });

        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
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
                                attributes: ["product_name"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member", "member_id"]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["nama_lengkap"]
                    }
                ],
                order: [["tanggal_penjualan", "DESC"]]
            });

            res.json({
                status: "success",
                data: penjualan
            });

        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
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
                        [Op.gte]: today
                    }
                },
                include: [
                    {
                        model: PenjualanDetail,
                        as: "details",
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["product_name", "isi"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member"]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["nama_lengkap"]
                    }
                ]
            });
    
            const summary = sales.reduce((acc, sale) => {
                acc.totalPenjualan += sale.total_akhir;
                sale.details.forEach(detail => {
                    acc.totalQty += detail.qty;
                    // Hitung HPP per unit menggunakan isi dari product
                    const hpp_per_unit = detail.harga_beli / detail.product.isi;
                    acc.totalHPP += detail.qty * hpp_per_unit;
                });
                acc.totalLaba = acc.totalPenjualan - acc.totalHPP;
                return acc;
            }, { totalQty: 0, totalPenjualan: 0, totalHPP: 0, totalLaba: 0 });
    
            res.json({
                status: "success",
                data: {
                    sales,
                    summary
                }
            });
    
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
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
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                },
                include: [
                    {
                        model: PenjualanDetail,
                        as: "details",
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["product_name", "isi"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member", "member_id"]
                    }
                ],
                order: [["tanggal_penjualan", "ASC"]]
            });

            // Hitung total penjualan dan laba
            const summary = sales.reduce((acc, sale) => {
                acc.totalPenjualan += sale.total_akhir;
                sale.details.forEach(detail => {
                    acc.totalQty += detail.qty;
                    // HPP dihitung berdasarkan harga beli produk yang sebenarnya
                    acc.totalHPP += detail.qty * detail.harga_beli; // harga_beli * qty per produk
                });
                // Laba dihitung sebagai total penjualan - total HPP
                acc.totalLaba = acc.totalPenjualan - acc.totalHPP;
                return acc;
            }, { totalQty: 0, totalPenjualan: 0, totalHPP: 0, totalLaba: 0 });
            

            res.json({
                status: "success",
                data: {
                    sales,
                    summary,
                    periode: {
                        startDate,
                        endDate
                    }
                }
            });

        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

export default PenjualanController;