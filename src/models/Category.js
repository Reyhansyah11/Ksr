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
        validate: {
            notEmpty: {
                msg: "Nama kategori harus diisi"
            }
        }
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "supplier",
            key: "supplier_id",
        },
    },
}, {
    timestamps: false,
    tableName: "category",
    hooks: {
        beforeCreate: async (category) => {
            const categoryCount = await Category.count({
                where: {
                    supplier_id: category.supplier_id
                }
            });
            
            if (categoryCount >= 2) {
                throw new Error('Supplier hanya boleh memiliki maksimal 2 kategori');
            }
        }
    }
});

export default Category;