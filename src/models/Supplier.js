import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Supplier = sequelize.define("supplier", {
    supplier_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    supplier_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    supplier_phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    supplier_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: "supplier",
});

export default Supplier;