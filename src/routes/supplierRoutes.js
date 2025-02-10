import express from 'express';
import SupplierController from '../controllers/supplierController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';
import { authorizeSupplier } from '../middleware/authSupplier.js';

const router = express.Router();

router.use(authenticateUser);

const supplierController = new SupplierController();

router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.post('/suppliers', authorizeAdmin, supplierController.createSupplier);
router.delete('/suppliers/:id', authorizeAdmin, supplierController.deleteSupplier);

// Route khusus untuk supplier
router.put('/suppliers/change-password', authorizeSupplier, supplierController.changePassword);

export default router;