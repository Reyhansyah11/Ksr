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
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "supplier",
            key: "supplier_id",
        },
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "category",
            key: "category_id",
        },
    },
    satuan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "satuan",
            key: "satuan_id",
        },
    },
    isi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,  // Default 1 jika tidak diisi
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