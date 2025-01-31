import express from "express";
import PembelianDetailController from "../controllers/pembelianDetailController.js";
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticateUser);

const pembelianDetailController = new PembelianDetailController();

// Endpoint untuk mendapatkan semua detail pembelian
router.get("/details", authorizeAdmin, pembelianDetailController.getAllPembelianDetails);

// Endpoint untuk mendapatkan detail pembelian berdasarkan pembelian ID
router.get("/details/pembelian/:pembelian_id", authorizeAdmin, pembelianDetailController.getPembelianDetailsByPembelianId);

// Endpoint untuk mendapatkan detail pembelian berdasarkan product ID
router.get("/details/product/:product_id", authorizeAdmin, pembelianDetailController.getPembelianDetailsByProductId);

export default router;
