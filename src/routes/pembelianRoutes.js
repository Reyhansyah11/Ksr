import express from "express";
import PembelianController from "../controllers/pembelianController.js";
import { authenticateUser } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize.js";

const router = express.Router();

router.use (authenticateUser)

const pembelianController = new PembelianController();

// Endpoint untuk membuat pembelian baru
router.post("/pembelian", authorizeAdmin, pembelianController.createPembelian);


// Endpoint untuk mendapatkan semua detail pembelian
router.get("/pembelian/weekly-expenses", authorizeAdmin, pembelianController.getWeeklyExpenses);

router.get("/pembelian/report", authorizeAdmin, pembelianController.getExpenseReport);

// Endpoint untuk mendapatkan semua pembelian
router.get("/pembelian", authorizeAdmin, pembelianController.getAllPembelian);

// Endpoint untuk mendapatkan pembelian berdasarkan ID
router.get("/pembelian/:id", authorizeAdmin, pembelianController.getPembelianById);

export default router;
