import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Satuan from "../models/Satuan.js";

class ProductController {
  constructor() {
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

  // Get all products
  getAllProducts = async (req, res) => {
    try {
      const products = await Product.findAll({
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
  // Create new product
  createProduct = async (req, res) => {
    try {
      const { product_name, category_id, satuan_id, isi, harga_beli } =
        req.body;

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
      const calculatedIsi = isi || product.isi; // Gunakan nilai isi dari product jika tidak diberikan
      const harga_beli_per_satuan = harga_beli / calculatedIsi; // Harga beli per unit kecil
      const margin_keuntungan = 20/100 * harga_beli_per_satuan; // 20% keuntungan
      const harga_jual = harga_beli_per_satuan + margin_keuntungan;

      const product = await Product.create({
        product_name,
        category_id,
        satuan_id,
        isi: calculatedIsi, // Set isi dengan nilai yang sudah dihitung
        harga_beli,
        harga_jual,
      });

      // Fetch the created product with its relations
      const createdProduct = await Product.findByPk(product.product_id, {
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
      const { product_name, category_id, satuan_id, isi, harga_beli } =
        req.body;

      let product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Produk tidak ditemukan",
        });
      }

      // Validasi input
      if (!product_name || !category_id || !satuan_id || !harga_beli) {
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
      const margin_keuntungan = 0.02 * harga_beli_per_satuan; // 2% keuntungan
      const harga_jual = harga_beli_per_satuan + margin_keuntungan;

      await product.update({
        product_name,
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
