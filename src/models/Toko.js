import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Toko = sequelize.define('toko', {
  toko_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama_toko: { type: DataTypes.STRING(50), allowNull: false },
  alamat: { type: DataTypes.STRING(100), allowNull: false },
  tlp_hp: { type: DataTypes.STRING(50), allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  timestamps: false, // Tidak menggunakan timestamps default Sequelize
  tableName: 'toko' // Nama tabel di database
});

export default Toko;
