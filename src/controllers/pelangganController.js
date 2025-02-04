import { Pelanggan } from "../models/index.js";
import memberExpiryService from '../services/memberExpiryService.js';

class PelangganController {
  // Get all pelanggan
  async getAllPelanggan(req, res) {
    try {
      const toko_id = req.user.toko_id;
      const pelanggan = await Pelanggan.findAll({
        order: [["pelanggan_id", "ASC"]],
      });

      res.json({
        status: "success",
        data: pelanggan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Get pelanggan by ID
  async getPelangganById(req, res) {
    try {
      const pelanggan = await Pelanggan.findByPk(req.params.id);

      if (!pelanggan) {
        return res.status(404).json({
          status: "error",
          message: "Pelanggan tidak ditemukan",
        });
      }

      res.json({
        status: "success",
        data: pelanggan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Create new pelanggan
  async createPelanggan(req, res) {
    try {
      const { nama_pelanggan, alamat, no_hp, is_member } = req.body;

      if (!nama_pelanggan) {
        return res.status(400).json({
          status: "error",
          message: "Nama pelanggan harus diisi",
        });
      }

      // Generate member ID jika is_member true
      let member_id = null;
      if (is_member) {
        member_id = "MBR" + Date.now().toString().slice(-8);
      }

      const pelanggan = await Pelanggan.create({
        nama_pelanggan,
        alamat,
        no_hp,
        is_member,
        member_id,
      });

      res.status(201).json({
        status: "success",
        message: "Pelanggan berhasil ditambahkan",
        data: pelanggan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // Update pelanggan
  async updatePelanggan(req, res) {
    try {
      const { nama_pelanggan, alamat, no_hp, is_member } = req.body;
      const pelanggan = await Pelanggan.findByPk(req.params.id);

      if (!pelanggan) {
        return res.status(404).json({
          status: "error",
          message: "Pelanggan tidak ditemukan",
        });
      }

      // Generate member ID jika pelanggan baru jadi member
      let member_id = pelanggan.member_id;
      if (is_member && !pelanggan.is_member) {
        member_id = "MBR" + Date.now().toString().slice(-8);
      }

      await pelanggan.update({
        nama_pelanggan,
        alamat,
        no_hp,
        is_member,
        member_id,
      });

      res.json({
        status: "success",
        message: "Pelanggan berhasil diperbarui",
        data: pelanggan,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // controllers/pelangganController.js
  async getMemberStatus(req, res) {
    try {
      // Ambil data member yang expired
      const expiredMembers = await memberExpiryService.checkExpiredMembers();

      // Ambil data member yang akan expired
      const nearExpiryMembers =
        await memberExpiryService.checkNearExpiryMembers();

      return res.status(200).json({
        status: "success",
        data: {
          expiredCount: expiredMembers,
          nearExpiryMembers: nearExpiryMembers,
          message: `${expiredMembers} member telah dinonaktifkan, ${nearExpiryMembers.length} member akan expired dalam 7 hari`,
        },
      });
    } catch (error) {
      console.error("Error mengambil status member:", error);
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil status member",
      });
    }
  }

  // Tambahkan di pelangganController.js
async reactivateMember(req, res) {
  try {
    const pelanggan = await Pelanggan.findByPk(req.params.id);

    if (!pelanggan) {
      return res.status(404).json({
        status: "error",
        message: "Pelanggan tidak ditemukan",
      });
    }

    // Generate member ID baru
    const member_id = "MBR" + Date.now().toString().slice(-8);

    // Update data member
    await pelanggan.update({
      is_member: true,
      member_id: member_id,
      last_transaction_date: new Date(), // Reset tanggal transaksi terakhir
    });

    res.json({
      status: "success",
      message: "Member berhasil diaktifkan kembali",
      data: pelanggan,
    });
  } catch (error) {
    res.status(500).json({
      status: "error", 
      message: error.message,
    });
  }
}

  // Delete pelanggan
  async deletePelanggan(req, res) {
    try {
      const pelanggan = await Pelanggan.findByPk(req.params.id);

      if (!pelanggan) {
        return res.status(404).json({
          status: "error",
          message: "Pelanggan tidak ditemukan",
        });
      }

      await pelanggan.destroy();

      res.json({
        status: "success",
        message: "Pelanggan berhasil dihapus",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

export default PelangganController;
