import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Pelanggan = sequelize.define("pelanggan", {
    pelanggan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nama_pelanggan: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    alamat: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    no_hp: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    is_member: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    member_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: "pelanggan"
});

// Method untuk menghitung diskon member
Pelanggan.prototype.hitungDiskon = function(totalBelanja) {
    if (!this.is_member) return 0;
    
    if (totalBelanja >= 1000000) return 0.10;  // 10% untuk belanja >= 1jt
    if (totalBelanja >= 300000) return 0.05;   // 5% untuk belanja >= 300rb
    if (totalBelanja >= 150000) return 0.02;   // 2% untuk belanja >= 150rb
    
    return 0;
};

export default Pelanggan;