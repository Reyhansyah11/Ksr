import express from "express";
import SatuanController from "../controllers/satuanController.js";
import { authorizeSupplier } from '../middleware/authSupplier.js';

const router = express.Router();

const satuanController = new SatuanController();

// Route to get all satuan
router.get("/satuan", satuanController.getAllSatuan);

// Route to get satuan by ID
router.get("/satuan/:id", satuanController.getSatuanById);

// Route to create new satuan
router.post("/satuan", authorizeSupplier, satuanController.createSatuan);

// Route to update satuan
router.put("/satuan/:id", authorizeSupplier, satuanController.updateSatuan);

// Route to delete satuan
router.delete("/satuan/:id", authorizeSupplier, satuanController.deleteSatuan);

export default router;