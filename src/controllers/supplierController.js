import { Supplier, Product, Satuan } from "../models/index.js";

class SupplierController {
  // Get all suppliers
  async getAllSuppliers(req, res) {
    try {
      const suppliers = await Supplier.findAll({
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["product_name", "harga_jual", "harga_beli", "isi"],
            through: { attributes: [] },
            include: [
              {
                model: Satuan,
                as: 'satuan',
                attributes: ['satuan_name']
              }
            ]
          },
        ],
      });

      res.status(200).json({
        status: "success",
        data: suppliers
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get supplier by ID
  async getSupplierById(req, res) {
    try {
      const supplier = await Supplier.findOne({
        where: {
          supplier_id: req.params.id,
        },
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["product_name", "harga_jual", "harga_beli", "isi"],
            through: { attributes: [] },
            include: [
              {
                model: Satuan,
                as: 'satuan',
                attributes: ['satuan_name']
              }
            ]
          },
        ],
      });

      if (!supplier) {
        return res.status(404).json({
          status: "error",
          message: "Supplier not found",
        });
      }

      res.status(200).json({
        status: "success",
        data: supplier
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Create new supplier
  async createSupplier(req, res) {
    try {
      const { supplier_name, supplier_phone, supplier_address, product_ids } =
        req.body;

      const supplier = await Supplier.create({
        supplier_name,
        supplier_phone,
        supplier_address,
      });

      if (product_ids && product_ids.length > 0) {
        await supplier.addProducts(product_ids);
      }

      const supplierWithProducts = await Supplier.findByPk(
        supplier.supplier_id,
        {
          include: [
            {
              model: Product,
              as: "products",
              attributes: ["product_name", "harga_jual", "harga_beli", "isi"],
              include: [
                {
                  model: Satuan,
                  as: 'satuan',
                  attributes: ['satuan_name']
                }
              ]
            },
          ],
        }
      );

      res.status(201).json({
        status: "success",
        data: supplierWithProducts
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Update supplier
  async updateSupplier(req, res) {
    try {
      const { supplier_name, supplier_phone, supplier_address, product_ids } =
        req.body;
      const supplier = await Supplier.findByPk(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          status: "error",
          message: "Supplier not found",
        });
      }

      await supplier.update({
        supplier_name,
        supplier_phone,
        supplier_address,
      });

      if (product_ids) {
        await supplier.setProducts(product_ids);
      }

      const updatedSupplier = await Supplier.findByPk(req.params.id, {
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["product_name", "harga_jual", "harga_beli", "isi"],
            include: [
              {
                model: Satuan,
                as: 'satuan',
                attributes: ['satuan_name']
              }
            ]
          },
        ],
      });

      res.status(200).json({
        status: "success",
        data: updatedSupplier
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Delete supplier
  async deleteSupplier(req, res) {
    try {
      const supplier = await Supplier.findByPk(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          status: "error",
          message: "Supplier not found",
        });
      }

      await supplier.destroy();

      res.status(200).json({
        status: "success",
        message: "Supplier deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get suppliers by product ID
  async getSuppliersByProduct(req, res) {
    try {
      const suppliers = await Supplier.findAll({
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["product_name", "harga_jual", "harga_beli", "isi"],
            through: { attributes: [] },
            where: { product_id: req.params.productId },
            include: [
              {
                model: Satuan,
                as: 'satuan',
                attributes: ['satuan_name']
              }
            ]
          },
        ],
      });

      res.status(200).json({
        status: "success",
        data: suppliers
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

export default SupplierController;