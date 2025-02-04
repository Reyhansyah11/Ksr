import { Category, Product, Supplier } from "../models/index.js";

class CategoryController {
    // Get all categories for a supplier
    async getAllCategories(req, res) {
        try {
            const supplier_id = req.user.supplier_id;
            const categories = await Category.findAll({
                where: { supplier_id },
                include: [{
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['supplier_name']
                }],
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
            const supplier_id = req.user.supplier_id;
            const category = await Category.findOne({
                where: {
                    category_id: req.params.id,
                    supplier_id
                },
                include: [{
                    model: Product,
                    as: 'products'
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
            const supplier_id = req.user.supplier_id;

            const category = await Category.create({
                category_name,
                supplier_id
            });

            const categoryWithSupplier = await Category.findOne({
                where: { category_id: category.category_id },
                include: [{
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['supplier_name']
                }]
            });

            res.status(201).json({
                status: "success",
                message: "Kategori berhasil ditambahkan",
                data: categoryWithSupplier
            });
        } catch (error) {
            let errorMessage = error.message;
            if (error.name === 'SequelizeValidationError') {
                errorMessage = error.errors[0].message;
            }
            
            res.status(400).json({
                status: "error",
                message: errorMessage
            });
        }
    }

    // Update category
    async updateCategory(req, res) {
        try {
            const { category_name } = req.body;
            const supplier_id = req.user.supplier_id;
            
            const category = await Category.findOne({
                where: {
                    category_id: req.params.id,
                    supplier_id
                }
            });

            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }

            await category.update({ category_name });

            const updatedCategory = await Category.findOne({
                where: { category_id: category.category_id },
                include: [{
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['supplier_name']
                }]
            });

            res.json({
                status: "success",
                message: "Kategori berhasil diperbarui",
                data: updatedCategory
            });
        } catch (error) {
            let errorMessage = error.message;
            if (error.name === 'SequelizeValidationError') {
                errorMessage = error.errors[0].message;
            }
            
            res.status(400).json({
                status: "error",
                message: errorMessage
            });
        }
    }

    // Delete category
    async deleteCategory(req, res) {
        try {
            const supplier_id = req.user.supplier_id;
            const category = await Category.findOne({
                where: {
                    category_id: req.params.id,
                    supplier_id
                },
                include: [{
                    model: Product,
                    as: 'products'
                }]
            });
            
            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Kategori tidak ditemukan"
                });
            }

            // Check if category has associated products
            if (category.products && category.products.length > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Tidak dapat menghapus kategori yang masih memiliki produk"
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

    // Get products by category
    async getProductsByCategory(req, res) {
        try {
            const supplier_id = req.user.supplier_id;
            const categoryId = req.params.id;
            
            const category = await Category.findOne({
                where: { 
                    category_id: categoryId,
                    supplier_id
                },
                include: [{
                    model: Product,
                    as: 'products',
                    attributes: [
                        'product_id', 
                        'product_name',
                        'harga_beli',
                        'harga_jual',
                        'stok'
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