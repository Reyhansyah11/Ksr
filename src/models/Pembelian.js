import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Pembelian  = sequelize.define("pembelian", {
    pembelian_id: {
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
    no_faktur: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    tanggal_pembelian: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "supplier",
            key: "supplier_id",
        },
    },
    total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total = harga_beli × jumlah_product"
    },
    bayar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    sisa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Sisa = bayar - total"
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: "pembelian",
});

export default Pembelian;
