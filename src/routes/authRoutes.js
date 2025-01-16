import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register); // Register user baru
router.post('/login', authController.login); // Login user
router.post('/logout', authController.logout); // Logout user

export default router;
