import { TokoProduct, Product, Category, Satuan, Supplier } from "../models/index.js";
import TokoProductService from "../services/TokoProductService.js";
import { Op, Sequelize } from 'sequelize';
import sequelize from "../config/database.js";  // Tambahkan ini

class ProductController {
  constructor() {
    this.tokoProductService = new TokoProductService();
    this.getTokoProducts = this.getTokoProducts.bind(this);
    this.updateTokoProductPrice = this.updateTokoProductPrice.bind(this);
    this.getAllProducts = this.getAllProducts.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
  }

  // Format product helper function
  formatProduct(product) {
    return {
      product_id: product.product_id,
      product_name: product.product_name,
      supplier_name: product.supplier.supplier_name,
      category_name: product.category.category_name,
      satuan_name: product.satuan.satuan_name,
      isi: product.isi,
      harga_beli: product.harga_beli,
      harga_jual: product.harga_jual,
      created_at: product.created_at,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  getTokoProducts = async (req, res) => {
    try {
      const toko_id = req.user.toko_id;
       const tokoProducts = await this.tokoProductService.getAllTokoProducts(toko_id);

      res.json({
        status: "sukses",
        data: tokoProducts,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Di ProductController
  getTokoCategories = async (req, res) => {
    try {
      const toko_id = req.user.toko_id;
  
      // Menggunakan raw query untuk mendapatkan kategori unik
      const categories = await sequelize.query(`
        SELECT DISTINCT c.category_name
        FROM category c
        INNER JOIN product p ON c.category_id = p.category_id
        INNER JOIN toko_product tp ON p.product_id = tp.product_id
        WHERE tp.toko_id = :toko_id
        ORDER BY c.category_name
      `, {
        replacements: { toko_id },
        type: Sequelize.QueryTypes.SELECT
      });
  
      res.json({
        status: "success",
        data: categories
      });
  
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  };

  // Di dalam class ProductController

// Di ProductController
getProductsByCategory = async (req, res) => {
  try {
    const toko_id = req.user.toko_id;
    const { category_name } = req.params;

    const products = await TokoProduct.findAll({
      where: { toko_id },
      include: [{
        model: Product,
        required: true,  // Pastikan product ada
        include: [{
          model: Category,
          as: 'category',
          where: { category_name },
          attributes: ['category_name']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['supplier_name']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['satuan_name']
        }]
      }]
    });

    if (products.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `Tidak ada produk dalam kategori ${category_name} di toko ini`
      });
    }

    // Format response
    const formattedProducts = products.map(item => ({
      toko_product_id: item.toko_product_id,
      stok: item.stok,
      harga_jual: item.harga_jual,
      product: {
        product_id: item.product.product_id,         // Ubah dari Product menjadi product
        product_name: item.product.product_name,     // Ubah dari Product menjadi product
        supplier_name: item.product.supplier.supplier_name,
        category_name: item.product.category.category_name,
        satuan_name: item.product.satuan.satuan_name,
        isi: item.product.isi,
        harga_beli: item.product.harga_beli
      }
    }));

    res.json({
      status: "success",
      data: formattedProducts
    });

  } catch (error) {
    console.log(error); // Tambahkan ini untuk debugging
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

  // Untuk admin: update harga jual
  updateTokoProductPrice = async (req, res) => {
    try {
      const { harga_jual } = req.body;
      const toko_id = req.user.toko_id;
      const product_id = req.params.id;

      const updatedProduct = await this.tokoProductService.updateHargaJual(
        toko_id,
        product_id,
        harga_jual
      );

      res.json({
        status: "sukses",
        message: "Harga jual berhasil diperbarui",
        data: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Get all products
  getAllProducts = async (req, res) => {
    try {
      const products = await Product.findAll({
        include: [
          {
            model: Supplier,
            as: "supplier",
            attributes: ["supplier_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
        ],
        order: [["product_id", "ASC"]],
      });

      // Format each product
      const formattedProducts = products.map((product) =>
        this.formatProduct(product)
      );

      res.json({
        status: "success",
        data: formattedProducts,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Get product by ID
  getProductById = async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Produk tidak ditemukan",
        });
      }

      const formattedProduct = this.formatProduct(product);

      res.json({
        status: "success",
        data: formattedProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Create new product
  createProduct = async (req, res) => {
    try {
      const { product_name, category_id, satuan_id, isi, harga_beli } = req.body;
  
      // Ambil supplier_id dari user yang login
      const supplier_id = req.user.supplier_id;
  
      // Validasi input
      if (!product_name || !category_id || !satuan_id || !harga_beli) {
        return res.status(400).json({
          status: "error",
          message: "Semua field harus diisi kecuali harga jual",
        });
      }
  
      // Validasi category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({
          status: "error",
          message: "Kategori tidak ditemukan",
        });
      }
  
      // Validasi satuan exists
      const satuan = await Satuan.findByPk(satuan_id);
      if (!satuan) {
        return res.status(404).json({
          status: "error",
          message: "Satuan tidak ditemukan",
        });
      }
  
      // Menghitung harga jual otomatis dengan margin keuntungan 20%
      const calculatedIsi = isi || 1; // Jika tidak ada isi, default 1
      const harga_beli_per_satuan = harga_beli / calculatedIsi; // Harga beli per unit kecil
      const margin_keuntungan = (20 / 100) * harga_beli_per_satuan; // 20% keuntungan
      const harga_jual = harga_beli_per_satuan + margin_keuntungan;
  
      const product = await Product.create({
        product_name,
        supplier_id,
        category_id,
        satuan_id,
        isi: calculatedIsi,
        harga_beli,
        harga_jual,
      });
  
      // Fetch the created product with its relations
      const createdProduct = await Product.findByPk(product.product_id, {
        include: [
          {
            model: Supplier,
            as: "supplier",
            attributes: ["supplier_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
        ],
      });
  
      const formattedProduct = this.formatProduct(createdProduct);
  
      res.status(201).json({
        status: "success",
        message: "Produk berhasil ditambahkan",
        data: formattedProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };
  

  // Update product
  updateProduct = async (req, res) => {
    try {
      const {
        product_name,
        category_id,
        satuan_id,
        isi,
        harga_beli,
      } = req.body;

      const supplier_id = req.user.supplier_id;

      let product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Produk tidak ditemukan",
        });
      }

      // Validasi input
      if (
        !product_name ||
        !category_id ||
        !satuan_id ||
        !harga_beli
      ) {
        return res.status(400).json({
          status: "error",
          message: "Semua field harus diisi kecuali harga jual",
        });
      }

      // Validasi category exists if category_id is changing
      if (category_id !== product.category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) {
          return res.status(404).json({
            status: "error",
            message: "Kategori tidak ditemukan",
          });
        }
      }

      // Validasi satuan exists if satuan_id is changing
      if (satuan_id !== product.satuan_id) {
        const satuan = await Satuan.findByPk(satuan_id);
        if (!satuan) {
          return res.status(404).json({
            status: "error",
            message: "Satuan tidak ditemukan",
          });
        }
      }

      // Menghitung harga jual otomatis dengan margin keuntungan 2%
      const calculatedIsi = isi || product.isi; // Gunakan nilai isi dari product jika tidak diberikan
      const harga_beli_per_satuan = harga_beli / calculatedIsi; // Harga beli per unit kecil
      const margin_keuntungan = (20 / 100) * harga_beli_per_satuan; // 2% keuntungan
      const harga_jual = harga_beli_per_satuan + margin_keuntungan;

      await product.update({
        product_name,
        supplier_id,
        category_id,
        satuan_id,
        isi: calculatedIsi,
        harga_beli,
        harga_jual,
      });

      // Fetch the updated product with its relations
      const updatedProduct = await Product.findByPk(req.params.id, {
        include: [
          {
            model: Supplier,
            as: "supplier",
            attributes: ["supplier_name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
        ],
      });

      const formattedProduct = this.formatProduct(updatedProduct);

      res.json({
        status: "success",
        message: "Produk berhasil diperbarui",
        data: formattedProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Get products by supplier
  getProductsBySupplier = async (req, res) => {
    try {
      const supplier_id = req.params.supplierId;

      const products = await Product.findAll({
        where: {
          supplier_id: supplier_id,
        },
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
          {
            model: Supplier,
            as: "supplier",
            attributes: ["supplier_name"],
          },
        ],
        order: [["product_id", "ASC"]],
      });

      if (!products.length) {
        return res.status(404).json({
          status: "error",
          message: "Tidak ada produk untuk supplier ini",
        });
      }

      const formattedProducts = products.map((product) =>
        this.formatProduct(product)
      );

      res.json({
        status: "success",
        data: formattedProducts,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };

  // Delete product
  deleteProduct = async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["category_name"],
          },
          {
            model: Satuan,
            as: "satuan",
            attributes: ["satuan_name"],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Produk tidak ditemukan",
        });
      }

      const formattedProduct = this.formatProduct(product);
      await product.destroy();

      res.json({
        status: "success",
        message: "Produk berhasil dihapus",
        data: formattedProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  };
}

export default ProductController;
