import express from "express";
import PenjualanController from "../controllers/penjualanController.js";
import { authenticateUser } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize.js";

const router = express.Router();
router.use(authenticateUser);

const penjualanController = new PenjualanController();

// Routes untuk kasir dan admin
router.post("/penjualan", penjualanController.createPenjualan);
router.get("/penjualan", penjualanController.getAllPenjualan);
router.get("/penjualan/daily-sales", penjualanController.getDailySales);
// Tambahkan route baru di bawah route report yang sudah ada
router.get("/penjualan/profit-loss-report", authorizeAdmin, penjualanController.getProfitLossReport);
router.get("/penjualan/combined-report", authorizeAdmin, penjualanController.getCombinedReport);
router.get("/penjualan/:id", penjualanController.getPenjualanById);
router.get("/penjualan/kasir/history", penjualanController.getPenjualanByUserId);
router.get("/penjualan/kasir/daily-sales", penjualanController.getDailySalesByUserId);


// Routes khusus admin (laporan laba rugi)
router.get("/penjualan/report", authorizeAdmin, penjualanController.getSalesReport);

export default router;