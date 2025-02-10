import express from 'express';
import ProductController from '../controllers/productController.js';
import { authorizeAdmin } from '../middleware/authorize.js';
import { authorizeSupplier } from '../middleware/authSupplier.js';

const router = express.Router();

const productController = new ProductController();

router.get("/products/supplier", productController.getAllProducts);
router.get("/products/supplier/:id", productController.getProductById);

// Route TokoProduct
router.get("/products/toko", productController.getTokoProducts);
router.get("/products/toko/categories", authorizeAdmin, productController.getTokoCategories);
router.get("/products/toko/category/:category_name", authorizeAdmin, productController.getProductsByCategory);
router.patch("/products/toko/:id/price", authorizeAdmin, productController.updateTokoProductPrice);

router.get("/products/supplier/list/:supplierId", productController.getProductsBySupplier);
router.post("/products/supplier", authorizeSupplier, productController.createProduct);
router.put("/products/supplier/:id", authorizeSupplier, productController.updateProduct);
router.delete("/products/supplier/:id", authorizeSupplier, productController.deleteProduct);

export default router;