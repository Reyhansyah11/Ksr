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