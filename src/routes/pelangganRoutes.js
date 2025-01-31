import express from 'express';
import PelangganController from '../controllers/pelangganController.js';
import { authenticateUser } from '../middleware/authenticate.js';

const router = express.Router();
const pelangganController = new PelangganController();

router.use(authenticateUser);

router.get('/pelanggan', pelangganController.getAllPelanggan);
router.get('/pelanggan/:id', pelangganController.getPelangganById);
router.post('/pelanggan', pelangganController.createPelanggan);
router.put('/pelanggan/:id', pelangganController.updatePelanggan);
router.delete('/pelanggan/:id', pelangganController.deletePelanggan);

export default router;