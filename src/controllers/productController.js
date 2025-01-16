import Product from "../models/Product.js";
import Category from "../models/Category.js";

class ProductController {
    // Get all products
    async getAllProducts(req, res) {
        try {
            const products = await Product.findAll({
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['category_name']
                }],
                order: [["product_id", "ASC"]]
            });
            
            res.json({
                status: "success",
                data: products
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Get product by ID
    async getProductById(req, res) {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['category_name']
                }]
            });
            
            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Produk tidak ditemukan"
                });
            }

            res.json({
                status: "success",
                data: product
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Create new product
    async createProduct(req, res) {
        try {
            const {
                product_name,
                category_id,
                satuan,
                harga_beli,
                harga_jual
            } = req.body;

            // Validasi input
            if (!product_name || !category_id || !satuan || !harga_beli) {
                return res.status(400).json({
                    status: "error",
                    message: "Semua field harus diisi kecuali harga jual"
                });
            }

            // Validasi category exists
            const category = await Category.findByPk(category_id);
            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }

            const product = await Product.create({
                product_name,
                category_id,
                satuan,
                harga_beli,
                harga_jual
            });

            res.status(201).json({
                status: "success",
                message: "Produk berhasil ditambahkan",
                data: product
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Update product
    async updateProduct(req, res) {
        try {
            const {
                product_name,
                category_id,
                satuan,
                harga_beli,
                harga_jual
            } = req.body;

            const product = await Product.findByPk(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Produk tidak ditemukan"
                });
            }

            // Validasi input
            if (!product_name || !category_id || !satuan || !harga_beli) {
                return res.status(400).json({
                    status: "error",
                    message: "Semua field harus diisi kecuali harga jual"
                });
            }

            // Validasi category exists if category_id is changing
            if (category_id !== product.category_id) {
                const category = await Category.findByPk(category_id);
                if (!category) {
                    return res.status(404).json({
                        status: "error",
                        message: "Kategori tidak ditemukan"
                    });
                }
            }

            await product.update({
                product_name,
                category_id,
                satuan,
                harga_beli,
                harga_jual
            });

            res.json({
                status: "success",
                message: "Produk berhasil diperbarui",
                data: product
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Delete product
    async deleteProduct(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Produk tidak ditemukan"
                });
            }

            await product.destroy();

            res.json({
                status: "success",
                message: "Produk berhasil dihapus"
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

export default ProductController;