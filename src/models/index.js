import Category from './Category.js';
import Product from './Product.js';
import Supplier from './Supplier.js';
import SupplierProduct from './SupplierProduct.js';

// Category - Product relationships
Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});

Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

// Supplier - Product relationships (many-to-many)
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

export {
    Category,
    Product,
    Supplier,
    SupplierProduct
};