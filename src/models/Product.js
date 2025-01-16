import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Product = sequelize.define("product", {
    product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    product_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "category",
            key: "category_id",
        },
    },
    satuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    harga_beli: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    harga_jual: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true, 
    tableName: "product",
});

export default Product;