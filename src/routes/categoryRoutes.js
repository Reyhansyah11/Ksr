import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeSupplier } from '../middleware/authSupplier.js';

const router = express.Router();
const categoryController = new CategoryController();

// Middleware
router.use(authenticateUser);

// Routes
router.get(
    "/categories", 
    authorizeSupplier, 
    categoryController.getAllCategories
);

router.get(
    "/categories/:id", 
    authorizeSupplier, 
    categoryController.getCategoryById
);

router.get(
    "/categories/:id/products", 
    authorizeSupplier, 
    categoryController.getProductsByCategory
);

router.post(
    "/categories", 
    authorizeSupplier, 
    categoryController.createCategory
);

router.put(
    "/categories/:id", 
    authorizeSupplier, 
    categoryController.updateCategory
);

router.delete(
    "/categories/:id", 
    authorizeSupplier, 
    categoryController.deleteCategory
);

export default router;