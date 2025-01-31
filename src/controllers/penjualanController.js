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
    async createPenjualan(req, res) {
        try {
            const { pelanggan_id, products, bayar } = req.body;
            const toko_id = req.user.toko_id;
            const user_id = req.user.user_id;

            // Validasi input
            if (!products || !Array.isArray(products) || products.length === 0 || !bayar) {
                return res.status(400).json({
                    status: "error",
                    message: "Produk dan jumlah bayar harus diisi"
                });
            }

            let total = 0;
            let penjualanDetails = [];

            // Validasi stok dan siapkan detail penjualan
            for (const item of products) {
                const { product_id, qty } = item;

                const tokoProduct = await TokoProduct.findOne({
                    where: { toko_id, product_id },
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                });

                if (!tokoProduct) {
                    return res.status(400).json({
                        status: "error",
                        message: `Produk dengan ID ${product_id} tidak tersedia di toko`
                    });
                }

                if (tokoProduct.stok < qty) {
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

            // Hitung diskon jika ada pelanggan member
            let diskon = 0;
            if (pelanggan_id) {
                const pelanggan = await Pelanggan.findByPk(pelanggan_id);
                if (pelanggan && pelanggan.is_member) {
                    if (total >= 1000000) diskon = 0.10;      // Diskon 10% untuk pembelian >= 1jt
                    else if (total >= 300000) diskon = 0.05;  // Diskon 5% untuk pembelian >= 300rb
                    else if (total >= 150000) diskon = 0.02;  // Diskon 2% untuk pembelian >= 150rb
                }
            }

            const total_akhir = total - (total * diskon);
            const sisa = bayar - total_akhir;

            // Validasi pembayaran
            if (bayar < total_akhir) {
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
                sisa
            });

            // Buat detail penjualan dan update stok
            for (const detail of penjualanDetails) {
                await PenjualanDetail.create({
                    penjualan_id: penjualan.penjualan_id,
                    ...detail
                });

                // Kurangi stok
                await this.tokoProductService.updateStokAfterPenjualan(
                    toko_id,
                    detail.product_id,
                    detail.qty
                );
            }

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
                                attributes: ["product_name"]
                            }
                        ]
                    },
                    {
                        model: Pelanggan,
                        as: "pelanggan",
                        attributes: ["nama_pelanggan", "is_member", "member_id"]
                    }
                ]
            });

            const totalPenjualan = sales.reduce((sum, sale) => sum + sale.total_akhir, 0);

            res.json({
                status: "success",
                data: {
                    sales,
                    totalPenjualan
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
                                attributes: ["product_name"]
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
                    acc.totalHPP += detail.qty * detail.harga_beli;
                });
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