import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Penjualan = sequelize.define("penjualan", {
    penjualan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    toko_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "toko",
            key: "toko_id",
        },
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "user",
            key: "user_id",
        },
    },
    pelanggan_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Boleh null untuk pelanggan non-member
        references: {
            model: "pelanggan",
            key: "pelanggan_id",
        },
    },
    tanggal_penjualan: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total sebelum diskon"
    },
    diskon: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: "Persentase diskon member"
    },
    total_akhir: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total setelah diskon"
    },
    bayar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    keterangan: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: "penjualan",
});

export default Penjualan;