import { Supplier } from "../models/index.js";
import bcrypt from "bcryptjs";

class SupplierController {
 async getAllSuppliers(req, res) {
   try {
     const suppliers = await Supplier.findAll();
     res.status(200).json({
       status: "success", 
       data: suppliers
     });
   } catch (error) {
     res.status(500).json({
       status: "error",
       message: error.message
     });
   }
 }

 async getSupplierById(req, res) {
   try {
     const supplier = await Supplier.findByPk(req.params.id);
     
     if (!supplier) {
       return res.status(404).json({
         status: "error",
         message: "Supplier not found"
       });
     }

     res.status(200).json({
       status: "success",
       data: supplier
     });
   } catch (error) {
     res.status(500).json({
       status: "error",
       message: error.message
     });
   }
 }

 async createSupplier(req, res) {
   try {
     const { supplier_name, supplier_phone, supplier_address, password } = req.body;

     const hashedPassword = await bcrypt.hash(password, 10);

     const supplier = await Supplier.create({
       supplier_name,
       supplier_phone, 
       supplier_address,
       password: hashedPassword
     });

     res.status(201).json({
       status: "success",
       data: supplier
     });
   } catch (error) {
     res.status(500).json({
       status: "error",
       message: error.message
     });
   }
 }

 async changePassword(req, res) {
  try {
    const supplier_id = req.user.supplier_id; // Ubah dari req.supplier_id menjadi req.user.supplier_id
    const { oldPassword, newPassword } = req.body;

    // Cari supplier berdasarkan ID
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier tidak ditemukan"
      });
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(oldPassword, supplier.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Password lama tidak sesuai"
      });
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await supplier.update({ password: hashedNewPassword });

    res.status(200).json({
      status: "success",
      message: "Password berhasil diubah"
    });
  } catch (error) {
    console.error('Error dalam changePassword:', error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
}

 async deleteSupplier(req, res) {
   try {
     const supplier = await Supplier.findByPk(req.params.id);

     if (!supplier) {
       return res.status(404).json({
         status: "error",
         message: "Supplier not found"
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
       message: error.message
     });
   }
 }
}

export default SupplierController;