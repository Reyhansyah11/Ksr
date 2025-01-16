import express from 'express';
import SupplierController from '../controllers/supplierController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticateUser)

const supplierController = new SupplierController();

// Bind the methods to maintain 'this' context
router.get('/suppliers', supplierController.getAllSuppliers.bind(supplierController));
router.get('/suppliers/:id', supplierController.getSupplierById.bind(supplierController));
router.post('/suppliers/', authorizeAdmin, supplierController.createSupplier.bind(supplierController));
router.put('/suppliers/:id', authorizeAdmin, supplierController.updateSupplier.bind(supplierController));
router.delete('/suppliers/:id', authorizeAdmin, supplierController.deleteSupplier.bind(supplierController));
router.get('/suppliers/product/:productId', supplierController.getSuppliersByProduct.bind(supplierController));

export default router;