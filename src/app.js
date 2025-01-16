import express from 'express';
import sequelize from './config/database.js';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js'
import { Category, Product } from './models/index.js';
import cors from 'cors'; // Untuk menangani CORS jika diperlukan

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Tambahkan jika ada permintaan lintas domain

// Sinkronisasi Database
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync({ alter: true }); // Alter, gunakan force untuk reset tabel (hati-hati menggunakan force)
    console.log('Database synchronized!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', supplierRoutes)

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
