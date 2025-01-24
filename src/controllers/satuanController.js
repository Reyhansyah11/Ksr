import Satuan from "../models/Satuan.js";

class SatuanController {
    // Get all satuan
    async getAllSatuan(req, res) {
        try {
            const satuan = await Satuan.findAll({
                order: [["satuan_id", "ASC"]]
            });
            
            res.json({
                status: "success",
                data: satuan
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Get satuan by ID
    async getSatuanById(req, res) {
        try {
            const satuan = await Satuan.findByPk(req.params.id);
            
            if (!satuan) {
                return res.status(404).json({
                    status: "error",
                    message: "Satuan tidak ditemukan"
                });
            }

            res.json({
                status: "success",
                data: satuan
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Create new satuan
    async createSatuan(req, res) {
        try {
            const { satuan_name } = req.body;

            if (!satuan_name) {
                return res.status(400).json({
                    status: "error",
                    message: "Nama satuan harus diisi"
                });
            }

            const satuan = await Satuan.create({
                satuan_name
            });

            res.status(201).json({
                status: "success",
                message: "Satuan berhasil ditambahkan",
                data: satuan
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Update satuan
    async updateSatuan(req, res) {
        try {
            const { satuan_name } = req.body;
            const satuan = await Satuan.findByPk(req.params.id);
            
            if (!satuan) {
                return res.status(404).json({
                    status: "error",
                    message: "Satuan tidak ditemukan"
                });
            }

            if (!satuan_name) {
                return res.status(400).json({
                    status: "error",
                    message: "Nama satuan harus diisi"
                });
            }

            await satuan.update({
                satuan_name
            });

            res.json({
                status: "success",
                message: "Satuan berhasil diperbarui",
                data: satuan
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Delete satuan
    async deleteSatuan(req, res) {
        try {
            const satuan = await Satuan.findByPk(req.params.id);
            
            if (!satuan) {
                return res.status(404).json({
                    status: "error",
                    message: "Satuan tidak ditemukan"
                });
            }

            // Check if satuan is being used by any products
            const products = await satuan.getProducts();
            if (products.length > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Satuan tidak dapat dihapus karena sedang digunakan oleh produk"
                });
            }

            await satuan.destroy();

            res.json({
                status: "success",
                message: "Satuan berhasil dihapus"
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

export default SatuanController;