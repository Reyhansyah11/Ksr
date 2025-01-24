// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
// const Toko = require('./Toko');

const User = sequelize.define('user', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(50), allowNull: false },
  nama_lengkap: { type: DataTypes.STRING(50), allowNull: false },
  alamat: { type: DataTypes.STRING(100), allowNull: false },
  access_level: { 
    type: DataTypes.ENUM('kasir', 'administrator'), 
    allowNull: false,
    defaultValue: 'kasir'
  },
  toko_id: { // Relasi ke Toko
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "toko", // Model Toko
      key: 'toko_id' // Primary key dari model Toko
    }
  }
}, {
  timestamps: false, // Jika tidak menggunakan timestamps default Sequelize
  tableName: 'user' // Sesuaikan dengan nama tabel di database
});

// Relasi antara User dan Toko

export default User;
