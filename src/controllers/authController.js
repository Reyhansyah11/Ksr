import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {User, Toko, Supplier} from '../models/index.js'

// Kunci rahasia JWT
const JWT_SECRET = process.env.JWT_SECRET; // Ganti dengan kunci rahasia yang aman

const authController = {
  // Register user baru
  // Controller untuk registrasi user
  register: async (req, res) => {
    try {
      const {
        username,
        password,
        email,
        nama_lengkap,
        alamat,
        toko_id,
        access_level,
      } = req.body;

      // Validasi input
      if (
        !username ||
        !password ||
        !email ||
        !nama_lengkap ||
        !alamat ||
        !toko_id
      ) {
        return res.status(400).json({ error: "Semua kolom wajib diisi!" });
      }

      // Periksa apakah username atau email sudah digunakan
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: "Username sudah digunakan!" });
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: "Email sudah digunakan!" });
      }

      // Validasi access_level
      const validAccessLevels = ["kasir", "administrator"];
      const userAccessLevel = validAccessLevels.includes(access_level)
        ? access_level
        : "kasir"; // Default 'kasir'

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat user baru
      const newUser = await User.create({
        username,
        password: hashedPassword,
        email,
        nama_lengkap,
        alamat,
        access_level: userAccessLevel,
        toko_id,
      });

      res.status(201).json({
        message: "User berhasil didaftarkan!",
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          access_level: newUser.access_level,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Terjadi kesalahan saat mendaftarkan user!" });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body; // Ganti 'username' jadi 'email'

      // Validasi input
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email dan password wajib diisi!" });
      }

      // Cari user berdasarkan email
      const user = await User.findOne({
        where: { email },
        include: [{ model: Toko, as: "toko" }],
      });
      if (!user) {
        return res.status(404).json({ error: "Email tidak ditemukan!" });
      }

      // Periksa password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Password salah!" });
      }

      // Buat token JWT
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email, // Ganti 'username' jadi 'email'
          access_level: user.access_level,
          toko_id: user.toko_id,
        },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: "1d" } // Token berlaku selama 1 hari
      );

      res.status(200).json({
        message: "Login berhasil!",
        token,
        user: {
          id: user.user_id,
          email: user.email, // Ganti 'username' jadi 'email'
          access_level: user.access_level,
          toko: user.toko, // Info toko
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan saat login!" });
    }
  },

  loginSupplier: async (req, res) => {
    try {
      const { supplier_name, password } = req.body;
   
      if (!supplier_name || !password) {
        return res.status(400).json({ error: "Supplier name dan password wajib diisi!" });
      }
   
      const supplier = await Supplier.findOne({ where: { supplier_name } });
      if (!supplier) {
        return res.status(404).json({ error: "Supplier tidak ditemukan!" });
      }
   
      const isPasswordValid = await bcrypt.compare(password, supplier.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Password salah!" });
      }
   
      const token = jwt.sign(
        {
          supplier_id: supplier.supplier_id,
          role: 'supplier'
        },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: "1d" } // Token berlaku selama 1 hari
      );
   
      res.status(200).json({
        message: "Login berhasil!",
        token,
        supplier: {
          id: supplier.supplier_id,
          name: supplier.supplier_name
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Terjadi kesalahan saat login!" });
    }
   },

  // Logout user
  logout: (req, res) => {
    try {
      // Untuk logout, cukup hapus token di sisi frontend
      res.status(200).json({ message: "Logout berhasil!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan saat logout!" });
    }
  },

  // Get users with access_level "kasir"
  getKasirUsers: async (req, res) => {
    try {
      const kasirUsers = await User.findAll({ where: { access_level: "kasir" } });

      res.status(200).json({
        message: "Berhasil mengambil data kasir!",
        users: kasirUsers,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan saat mengambil data kasir!" });
    }
  },
};

export default authController;
