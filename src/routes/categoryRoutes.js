import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeSupplier } from '../middleware/authSupplier.js';

const router = express.Router();
router.use(authenticateUser); // Add authentication middleware

const categoryController = new CategoryController();

router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:name", categoryController.getProductsByCategory);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", authorizeSupplier, categoryController.createCategory);
router.put("/categories/:id", authorizeSupplier, categoryController.updateCategory);
router.delete("/categories/:id", authorizeSupplier, categoryController.deleteCategory);

export default router;