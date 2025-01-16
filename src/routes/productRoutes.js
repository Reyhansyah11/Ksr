import express from 'express';
import ProductController from '../controllers/productController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticateUser);

const productController = new ProductController();

router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.post("/products", authorizeAdmin, productController.createProduct);
router.put("/products/:id", authorizeAdmin, productController.updateProduct);
router.delete("/products/:id", authorizeAdmin, productController.deleteProduct);

export default router;