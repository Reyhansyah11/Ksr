import { Pembelian, Product, SupplierProduct, User, Toko, PembelianDetail, TokoProduct } from "../models/index.js";
import TokoProductService from '../services/TokoProductService.js';

class PembelianController {
    constructor() {
        this.tokoProductService = new TokoProductService();
    }

    createPembelian = async (req, res) => {
        try {
            const {
                toko_id,
                user_id,
                no_faktur,
                tanggal_pembelian,
                supplier_id,
                products,
                bayar,
            } = req.body;

            let totalPembelian = 0;
            let pembelianDetails = [];

            if (!toko_id || !user_id || !no_faktur || !supplier_id || !products || !bayar) {
                return res.status(400).json({
                    status: "error",
                    message: "Semua field harus diisi"
                });
            }

            for (const product of products) {
                const { product_id, jumlah_product } = product;

                const isProductFromSupplier = await SupplierProduct.findOne({
                    where: { supplier_id, product_id }
                });

                if (!isProductFromSupplier) {
                    return res.status(400).json({
                        status: "error",
                        message: `Produk ID ${product_id} tidak tersedia dari supplier yang dipilih`,
                    });
                }

                const productData = await Product.findByPk(product_id);
                const totalHargaProduk = productData.harga_beli * jumlah_product;
                totalPembelian += totalHargaProduk;

                const qty = jumlah_product * productData.isi;
                pembelianDetails.push({
                    product_id,
                    qty,
                    harga_beli: productData.harga_beli,
                });
            }

            const sisa = bayar - totalPembelian;

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

            for (const detail of pembelianDetails) {
                await PembelianDetail.create({
                    pembelian_id: pembelian.pembelian_id,
                    product_id: detail.product_id,
                    qty: detail.qty,
                    harga_beli: detail.harga_beli,
                });

                const [tokoProduct] = await TokoProduct.findOrCreate({
                    where: { 
                        toko_id,
                        product_id: detail.product_id 
                    },
                    defaults: {
                        stok: 0,
                        harga_jual: Math.ceil(detail.harga_beli * 1.2)
                    }
                });

                await tokoProduct.increment('stok', { by: detail.qty });
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