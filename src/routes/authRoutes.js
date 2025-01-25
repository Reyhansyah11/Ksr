import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorize.js';

const router = express.Router();

router.get('/kasirUsers', authenticateUser, authorizeAdmin, authController.getKasirUsers);
router.post('/login', authController.login); // Login (Public Route)
router.post('/register', authenticateUser, authorizeAdmin, authController.register); // Protected Route (Admin Only)
router.post('/logout', authenticateUser, authController.logout); // Logout (User Must Be Authenticated)

export default router;
