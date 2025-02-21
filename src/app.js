import express from 'express';
import sequelize from './config/database.js';
import dotenv from 'dotenv';
import expirySchedulerService from './services/expirySchedulerService.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js'
import satuanRoutes from './routes/satuamRoutes.js'
import pembelianRoutes from './routes/pembelianRoutes.js'
import pembelianDetailRoutes from './routes/pembelianDetailRoutes.js'
import pelangganRoutes from './routes/pelangganRoutes.js'
import penjualanRoutes from './routes/penjualanRoutes.js'
import TokoProductService from './services/TokoProductService.js';
import { Category, Product } from './models/index.js';
import cors from 'cors'; // Untuk menangani CORS jika diperlukan

import DatabaseBackupService from './services/DatabaseBackupService.js';
import backupRoutes from './routes/backupRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
// Konfigurasi CORS
app.use(cors({
  origin: 'http://localhost:5173', // Alamat frontend React
  credentials: true,
}));

// Tambahkan scheduler untuk cek member expired
const startMemberExpiryScheduler = () => {
  // Jalankan pengecekan setiap hari pada jam 00:00
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('Menjalankan pengecekan member expired...');
      await memberExpiryService.checkAndUpdateExpiredMembers();
    }
  }, 60000); // Check setiap menit
};

const backupService = new DatabaseBackupService();
backupService.scheduleBackup();

// Sinkronisasi Database
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync({ alter: true }); // Alter, gunakan force untuk reset tabel (hati-hati menggunakan force)
    console.log('Database synchronized!');

    // Mulai scheduler dengan service baru
    expirySchedulerService.startExpiryChecker();
    console.log('Member expiry scheduler dimulai');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', supplierRoutes);
app.use('/api', satuanRoutes);
app.use('/api', pembelianRoutes);
app.use('/api', pembelianDetailRoutes);
app.use('/api', pelangganRoutes);
app.use('/api', penjualanRoutes);
app.use('/api', backupRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Server berjalan dengan baik!');
});

// Jalankan Server
const PORT = process.env.PORT || 5000; // Default ke 5000 jika PORT tidak diatur
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

export default app; // Ekspor untuk testing jika diperlukan
