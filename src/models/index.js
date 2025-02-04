import Toko from './Toko.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import Supplier from './Supplier.js';
import Satuan from './Satuan.js';
import Pembelian from './Pembelian.js';
import PembelianDetail from './PembelianDetail.js';
import TokoProduct from './TokoProduct.js';
import Pelanggan from './Pelanggan.js';
import Penjualan from './Penjualan.js';
import PenjualanDetail from './PenjualanDetail.js';

// Relasi User - Toko
User.belongsTo(Toko, { foreignKey: 'toko_id', as: 'toko' });
Toko.hasMany(User, { foreignKey: 'toko_id', as: 'users' });

// Relasi Category - Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Relasi Satuan - Product  
Satuan.hasMany(Product, { foreignKey: 'satuan_id', as: 'products' });
Product.belongsTo(Satuan, { foreignKey: 'satuan_id', as: 'satuan' });

// Relasi Supplier - Product
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Add this to your existing relationships
Supplier.hasMany(Category, { foreignKey: 'supplier_id', as: 'category' });
Category.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Relasi Pembelian - PembelianDetail
Pembelian.hasMany(PembelianDetail, { foreignKey: 'pembelian_id', as: 'details' });
PembelianDetail.belongsTo(Pembelian, { foreignKey: 'pembelian_id', as: 'pembelian' });

// Relasi User - Pembelian
User.hasMany(Pembelian, { foreignKey: 'user_id', as: 'pembelian' });
Pembelian.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Relasi Supplier - Pembelian
Supplier.hasMany(Pembelian, { foreignKey: 'supplier_id', as: 'pembelian' });
Pembelian.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Relasi Toko - Pembelian
Toko.hasMany(Pembelian, { foreignKey: 'toko_id', as: 'pembelian' });
Pembelian.belongsTo(Toko, { foreignKey: 'toko_id', as: 'toko' });

// Relasi PembelianDetail - Product
PembelianDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PembelianDetail, { foreignKey: 'product_id', as: 'pembelianDetails' });

// Relasi TokoProduct dengan Product dan Toko
TokoProduct.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(TokoProduct, { foreignKey: 'product_id' });

Toko.belongsToMany(Product, { 
    through: TokoProduct, 
    foreignKey: 'toko_id', 
    otherKey: 'product_id', 
    as: 'products' 
});
Product.belongsToMany(Toko, { 
    through: TokoProduct, 
    foreignKey: 'product_id', 
    otherKey: 'toko_id', 
    as: 'toko' 
});

// Relasi untuk Penjualan
// Relasi Penjualan dengan Toko dan User
PenjualanDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PenjualanDetail, { foreignKey: 'product_id', as: 'penjualanDetails' });

Toko.hasMany(Penjualan, { foreignKey: 'toko_id', as: 'penjualan' });
Penjualan.belongsTo(Toko, { foreignKey: 'toko_id', as: 'toko' });

User.hasMany(Penjualan, { foreignKey: 'user_id', as: 'penjualan' });
Penjualan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Relasi Penjualan dengan Pelanggan
Pelanggan.hasMany(Penjualan, { foreignKey: 'pelanggan_id', as: 'penjualan' });
Penjualan.belongsTo(Pelanggan, { foreignKey: 'pelanggan_id', as: 'pelanggan' });

// Relasi Penjualan dengan PenjualanDetail
Penjualan.hasMany(PenjualanDetail, { foreignKey: 'penjualan_id', as: 'details' });
PenjualanDetail.belongsTo(Penjualan, { foreignKey: 'penjualan_id', as: 'penjualan' });

// Relasi PenjualanDetail dengan TokoProduct
PenjualanDetail.belongsTo(TokoProduct, {
    foreignKey: 'product_id',
    targetKey: 'product_id',
    as: 'toko_product',
    constraints: false
});

TokoProduct.hasMany(PenjualanDetail, {
    foreignKey: 'product_id',
    sourceKey: 'product_id',
    as: 'penjualan_details',
    constraints: false
});

// Relasi untuk memastikan penjualan menggunakan produk dari toko yang benar
Penjualan.belongsTo(TokoProduct, {
    foreignKey: 'toko_id',
    targetKey: 'toko_id',
    as: 'toko_products',
    constraints: false
});

export {
    User,
    Toko, 
    Category,
    Product,
    Supplier,
    Satuan,
    Pembelian,
    PembelianDetail,
    TokoProduct,
    Pelanggan,
    Penjualan,
    PenjualanDetail
};