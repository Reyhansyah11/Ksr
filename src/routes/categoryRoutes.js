import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import {authenticateUser} from '../middleware/authenticate.js';
import {authorizeAdmin} from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticateUser);

const categoryController = new CategoryController();

router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:name", categoryController.getProductsByCategory);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", authorizeAdmin, categoryController.createCategory);
router.put("/categories/:id", authorizeAdmin, categoryController.updateCategory);
router.delete("/categories/:id", authorizeAdmin, categoryController.deleteCategory);

export default router;