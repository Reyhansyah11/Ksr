import express from "express";
import SatuanController from "../controllers/satuanController.js";
import { authenticateUser } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticateUser);

const satuanController = new SatuanController();

// Route to get all satuan
router.get("/satuan", satuanController.getAllSatuan);

// Route to get satuan by ID
router.get("/satuan/:id", satuanController.getSatuanById);

// Route to create new satuan
router.post("/satuan", authorizeAdmin, satuanController.createSatuan);

// Route to update satuan
router.put("/satuan/:id", authorizeAdmin, satuanController.updateSatuan);

// Route to delete satuan
router.delete("/satuan/:id", authorizeAdmin, satuanController.deleteSatuan);

export default router;