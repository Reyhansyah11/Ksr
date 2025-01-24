import Toko from './Toko.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import Supplier from './Supplier.js';
import SupplierProduct from './SupplierProduct.js';
import Satuan from './Satuan.js';
import Pembelian from './Pembelian.js';  // Pastikan model Pembelian diimpor
import PembelianDetail from './PembelianDetail.js';  // Pastikan model PembelianDetail diimpor

// Relasi User - Toko
User.belongsTo(Toko, { 
    foreignKey: 'toko_id', 
    as: 'toko' 
});

Toko.hasMany(User, { 
    foreignKey: 'toko_id',
    as: 'users' 
});

// Relasi Category - Product
Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});

Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

// Relasi Supplier - Product (many-to-many)
Supplier.belongsToMany(Product, {
    through: SupplierProduct,
    foreignKey: 'supplier_id',
    otherKey: 'product_id',
    as: 'products'
});

Product.belongsToMany(Supplier, {
    through: SupplierProduct,
    foreignKey: 'product_id',
    otherKey: 'supplier_id',
    as: 'suppliers'
});

// Relasi Satuan - Product
Satuan.hasMany(Product, {
    foreignKey: 'satuan_id',
    as: 'products'
});

Product.belongsTo(Satuan, {
    foreignKey: 'satuan_id',
    as: 'satuan'
});

// Relasi Pembelian - PembelianDetail
Pembelian.hasMany(PembelianDetail, {
    foreignKey: 'pembelian_id',
    as: 'details'
});

PembelianDetail.belongsTo(Pembelian, {
    foreignKey: 'pembelian_id',
    as: 'pembelian'
});

// Relasi PembelianDetail - Product
PembelianDetail.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

Product.hasMany(PembelianDetail, {
    foreignKey: 'product_id',
    as: 'pembelianDetails'
});

// Ekspor semua model
export {
    User,
    Toko,
    Category,
    Product,
    Supplier,
    SupplierProduct,
    Satuan,
    Pembelian,
    PembelianDetail
};
