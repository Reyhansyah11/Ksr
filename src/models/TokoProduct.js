import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TokoProduct = sequelize.define("toko_product", {
    toko_product_id: {
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
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "product",
            key: "product_id",
        },
    },
    stok: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    harga_jual: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: "toko_product",
    indexes: [
        {
            unique: true,
            fields: ['toko_id', 'product_id']
        }
    ]
});

export default TokoProduct;