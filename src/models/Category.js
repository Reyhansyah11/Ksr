import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Category = sequelize.define("category", {
    category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    category_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
}, {
    timestamps: false, // Jika tidak menggunakan timestamps default Sequelize
    tableName: "category", // Sesuaikan dengan nama tabel di database
});

export default Category;