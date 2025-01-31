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
router.get("/penjualan/:id", penjualanController.getPenjualanById);
router.get("/penjualan/daily", penjualanController.getDailySales);

// Routes khusus admin (laporan laba rugi)
router.get("/penjualan/report", authorizeAdmin, penjualanController.getSalesReport);

export default router;