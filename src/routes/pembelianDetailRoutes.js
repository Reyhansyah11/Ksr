import express from "express";
import PembelianDetailController from "../controllers/pembelianDetailController.js";
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticateUser);

const pembelianDetailController = new PembelianDetailController();

// Endpoint untuk mendapatkan semua detail pembelian
router.get("/", pembelianDetailController.getAllPembelianDetails);

// Endpoint untuk mendapatkan detail pembelian berdasarkan pembelian ID
router.get("/pembelian/:pembelian_id", pembelianDetailController.getPembelianDetailsByPembelianId);

// Endpoint untuk mendapatkan detail pembelian berdasarkan product ID
router.get("/product/:product_id", pembelianDetailController.getPembelianDetailsByProductId);

export default router;
