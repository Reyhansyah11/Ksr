import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PenjualanDetail = sequelize.define("penjualan_detail", {
    penjualan_detail_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    penjualan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "penjualan",
            key: "penjualan_id",
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
        comment: "Jumlah barang yang dibeli"
    },
    harga_beli: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Harga beli dari toko_product saat transaksi (untuk perhitungan laba)"
    },
    harga_jual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Harga jual dari toko_product saat transaksi"
    },
    subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "qty × harga_jual"
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    tableName: "penjualan_detail",
});

// Method untuk menghitung subtotal berdasarkan harga jual dari toko_product
PenjualanDetail.prototype.hitungSubtotal = async function() {
    const tokoProduct = await this.getToko_product();
    if (tokoProduct) {
        this.harga_jual = tokoProduct.harga_jual;
        this.subtotal = this.qty * this.harga_jual;
    }
};

export default PenjualanDetail;