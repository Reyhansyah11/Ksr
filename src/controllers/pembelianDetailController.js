import { PembelianDetail, Product, Pembelian } from "../models/index.js";

class PembelianDetailController {
    constructor() {
        this.getPembelianDetailsByPembelianId = this.getPembelianDetailsByPembelianId.bind(this);
        this.getPembelianDetailsByProductId = this.getPembelianDetailsByProductId.bind(this);
        this.getAllPembelianDetails = this.getAllPembelianDetails.bind(this);
    }

    // Mendapatkan semua detail pembelian untuk satu transaksi pembelian
    getPembelianDetailsByPembelianId = async (req, res) => {
        try {
            const { pembelian_id } = req.params;

            const pembelianDetails = await PembelianDetail.findAll({
                where: { pembelian_id },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: ["product_name", "harga_beli"],
                    },
                ],
            });

            if (!pembelianDetails || pembelianDetails.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Detail pembelian tidak ditemukan untuk ID pembelian ini",
                });
            }

            res.json({
                status: "success",
                data: pembelianDetails,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    };

    // Mendapatkan semua detail pembelian untuk satu produk
    getPembelianDetailsByProductId = async (req, res) => {
        try {
            const { product_id } = req.params;

            const pembelianDetails = await PembelianDetail.findAll({
                where: { product_id },
                include: [
                    {
                        model: Pembelian,
                        as: "pembelian",
                        attributes: ["pembelian_id", "no_faktur", "tanggal_pembelian"],
                    },
                ],
            });

            if (!pembelianDetails || pembelianDetails.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Detail pembelian tidak ditemukan untuk ID produk ini",
                });
            }

            res.json({
                status: "success",
                data: pembelianDetails,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    };

    // Mendapatkan semua detail pembelian
    getAllPembelianDetails = async (req, res) => {
        try {
            const pembelianDetails = await PembelianDetail.findAll({
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: ["product_name", "harga_beli"],
                    },
                    {
                        model: Pembelian,
                        as: "pembelian",
                        attributes: ["pembelian_id", "no_faktur", "tanggal_pembelian"],
                    },
                ],
            });

            res.json({
                status: "success",
                data: pembelianDetails,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    };
}

export default PembelianDetailController;
