import {
  TokoProduct,
  Product,
  Category,
  Satuan,
  Supplier,
  PembelianDetail,
} from "../models/index.js";

class TokoProductService {
  // Menambah stok setelah pembelian
  async updateStokAfterPembelian(toko_id, pembelian_id) {
    try {
      const pembelianDetails = await PembelianDetail.findAll({
        where: { pembelian_id },
        include: [
          {
            model: Product,
            as: "product",
          },
        ],
      });

      for (const detail of pembelianDetails) {
        const [tokoProduct] = await TokoProduct.findOrCreate({
          where: {
            toko_id,
            product_id: detail.product_id,
          },
          defaults: {
            stok: 0,
            harga_jual: detail.harga_jual || detail.harga_beli * 1.2,
            harga_beli: detail.harga_beli,
          },
        });

        // Update stok dengan memperhatikan isi produk
        const stokDalamPcs = detail.qty * detail.product.isi;
        await tokoProduct.increment("stok", { by: stokDalamPcs });

        // Perbarui harga beli jika berbeda
        if (tokoProduct.harga_beli !== detail.harga_beli) {
          await tokoProduct.update({ harga_beli: detail.harga_beli });
        }
      }
    } catch (error) {
      throw new Error(`Gagal memperbarui stok: ${error.message}`);
    }
  }

  // Mengurangi stok setelah penjualan
  async updateStokAfterPenjualan(toko_id, product_id, qty) {
    try {
      const tokoProduct = await TokoProduct.findOne({
        where: { toko_id, product_id },
      });

      if (!tokoProduct) {
        throw new Error("Produk tidak tersedia di toko ini");
      }

      if (tokoProduct.stok < qty) {
        throw new Error(
          `Stok tidak mencukupi. Stok tersedia: ${tokoProduct.stok}`
        );
      }

      await tokoProduct.decrement("stok", { by: qty });

      return tokoProduct;
    } catch (error) {
      throw new Error(`Gagal memperbarui stok: ${error.message}`);
    }
  }

  // Mendapatkan informasi produk di toko tertentu
  // Di TokoProductService.js
  // Mendapatkan informasi produk di toko tertentu
  async getAllTokoProducts(toko_id) {
    try {
      const tokoProducts = await TokoProduct.findAll({
        where: { toko_id },
        include: [
          {
            model: Product,
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
          },
        ],
      });

      return tokoProducts.map((product) => ({
        ...product.toJSON(),
        harga_beli: product.harga_beli, // Pastikan harga_beli ada di response
      }));
    } catch (error) {
      throw new Error(`Gagal mendapatkan daftar produk toko: ${error.message}`);
    }
  }

  // Mendapatkan stok produk di toko
  async getStok(toko_id, product_id) {
    try {
      const tokoProduct = await TokoProduct.findOne({
        where: { toko_id, product_id },
      });
      return tokoProduct?.stok || 0;
    } catch (error) {
      throw new Error(`Gagal mendapatkan stok: ${error.message}`);
    }
  }

  // Menambahkan method baru di TokoProductService
  async getProductsByCategory(toko_id, category_name) {
    try {
      const tokoProducts = await TokoProduct.findAll({
        where: { toko_id },
        include: [
          {
            model: Product,
            include: [
              {
                model: Category,
                as: "category",
                attributes: ["category_name"],
                where: {
                  category_name: category_name,
                },
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
          },
        ],
      });

      return tokoProducts;
    } catch (error) {
      throw new Error(
        `Gagal mendapatkan produk berdasarkan kategori: ${error.message}`
      );
    }
  }

  // Update harga jual produk di toko
  // Update harga jual dan harga beli produk di toko
  async updateHargaJual(toko_id, product_id, harga_jual, harga_beli) {
    try {
      const tokoProduct = await TokoProduct.findOne({
        where: { toko_id, product_id },
      });

      if (!tokoProduct) {
        throw new Error("Produk tidak tersedia di toko ini");
      }

      // Update harga jual dan harga beli
      await tokoProduct.update({ harga_jual, harga_beli });
      return tokoProduct;
    } catch (error) {
      throw new Error(
        `Gagal memperbarui harga jual dan harga beli: ${error.message}`
      );
    }
  }
}

export default TokoProductService;
