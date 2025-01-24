import express from "express";
import PembelianController from "../controllers/pembelianController.js";
import { authenticateUser } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize.js";

const router = express.Router();

router.use (authenticateUser)

const pembelianController = new PembelianController();

// Endpoint untuk membuat pembelian baru
router.post("/pembelian", authorizeAdmin, pembelianController.createPembelian);

// Endpoint untuk mendapatkan semua pembelian
router.get("/pembelian", pembelianController.getAllPembelian);

// Endpoint untuk mendapatkan pembelian berdasarkan ID
router.get("/pembelian/:id", pembelianController.getPembelianById);

export default router;
