// services/memberExpiryService.js
import { Op } from "sequelize";
import { Pelanggan } from "../models/index.js";

class MemberExpiryService {
  async checkExpiredMembers() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Cari member yang tidak aktif selama 30 hari
      const expiredMembers = await Pelanggan.findAll({
        where: {
          is_member: true,
          last_transaction_date: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      // Nonaktifkan member yang expired
      for (const member of expiredMembers) {
        await Pelanggan.update(
          { 
            is_member: false,
            member_id: null,
            last_transaction_date: null 
          },
          { 
            where: { 
              pelanggan_id: member.pelanggan_id 
            } 
          }
        );
      }

      return expiredMembers.length;
    } catch (error) {
      console.error('Error saat memeriksa member expired:', error);
      throw error;
    }
  }

  async checkNearExpiryMembers() {
    try {
      const twentyThreeDaysAgo = new Date();
      twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23); // 30-7 = 23 hari

      // Cari member yang akan expired dalam 7 hari
      const nearExpiryMembers = await Pelanggan.findAll({
        where: {
          is_member: true,
          last_transaction_date: {
            [Op.lt]: twentyThreeDaysAgo
          }
        }
      });

      return nearExpiryMembers;
    } catch (error) {
      console.error('Error saat memeriksa member yang akan expired:', error);
      throw error;
    }
  }
}

export default new MemberExpiryService();