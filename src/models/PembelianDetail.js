import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PembelianDetail = sequelize.define("pembelian_detail", {
    pembelian_detail_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    pembelian_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "pembelian",
            key: "pembelian_id",
        },
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "product",
            key: "product_id",
        },
    },
    qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Jumlah dalam pieces (qty = jumlah_product × isi). Misal: 2 dus × 24 pcs = 48 pcs"
    },
    harga_beli: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    harga_jual: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: "pembelian_detail",
});

export default PembelianDetail;