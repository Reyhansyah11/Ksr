import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Satuan = sequelize.define ("satuan", {
    satuan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    satuan_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true, // Jika tidak menggunakan timestamps default Sequelize
    tableName: "satuan", // Sesuaikan dengan nama tabel di database
})

export default Satuan;