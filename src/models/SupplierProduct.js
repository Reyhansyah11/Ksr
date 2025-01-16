import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SupplierProduct = sequelize.define("supplier_product", {
    supplier_product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "supplier",
            key: "supplier_id"
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "product",
            key: "product_id"
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: "supplier_product",
});

export default SupplierProduct;