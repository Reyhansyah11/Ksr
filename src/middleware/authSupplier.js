import jwt from "jsonwebtoken";

export const authorizeSupplier = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Ambil token dari header Authorization
  if (!token) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode token
    if (!decoded.supplier_id) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden - Anda bukan supplier",
      });
    }

    // Simpan informasi user ke req.user
    req.user = {
      supplier_id: decoded.supplier_id,
      toko_id: decoded.toko_id, // jika ada
    };

    next();
  } catch (error) {
    res.status(401).json({ status: "error", message: "Invalid token" });
  }
};
