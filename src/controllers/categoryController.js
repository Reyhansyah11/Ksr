
import { Category, Product } from "../models/index.js";

class CategoryController {
    // Get all categories
    async getAllCategories(req, res) {
        try {
            const categories = await Category.findAll({
                order: [["category_id", "ASC"]]
            });
            res.json({
                status: "success",
                data: categories
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Get category by ID
    async getCategoryById(req, res) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }
            res.json({
                status: "success",
                data: category
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Create new category
    async createCategory(req, res) {
        try {
            const { category_name } = req.body;
            
            // Validasi input
            if (!category_name) {
                return res.status(400).json({
                    status: "error",
                    message: "Nama kategori harus diisi"
                });
            }

            const category = await Category.create({
                category_name: category_name
            });

            res.status(201).json({
                status: "success",
                message: "Kategori berhasil ditambahkan",
                data: category
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Update category
    async updateCategory(req, res) {
        try {
            const { category_name } = req.body;
            const category = await Category.findByPk(req.params.id);

            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }

            // Validasi input
            if (!category_name) {
                return res.status(400).json({
                    status: "error", 
                    message: "Nama kategori harus diisi"
                });
            }

            await category.update({
                category_name: category_name
            });

            res.json({
                status: "success",
                message: "Kategori berhasil diperbarui",
                data: category
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Delete category
    async deleteCategory(req, res) {
        try {
            const category = await Category.findByPk(req.params.id);
            
            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }

            await category.destroy();

            res.json({
                status: "success",
                message: "Kategori berhasil dihapus"
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Tambahkan method ini di dalam class CategoryController:

async getProductsByCategory(req, res) {
    try {
        const categoryName = req.params.name;
        
        // Cari kategori berdasarkan nama
        const category = await Category.findOne({
            where: { category_name: categoryName },
            include: [{
                model: Product,
                as: 'products',  // sesuai dengan alias yang didefinisikan di relasi
                attributes: [
                    'product_id', 
                    'product_name',
                    'satuan',
                    'harga_beli',
                    'harga_jual'
                ]
            }]
        });

        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Kategori tidak ditemukan"
            });
        }

        res.json({
            status: "success",
            data: {
                category_name: category.category_name,
                products: category.products
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

export default CategoryController;