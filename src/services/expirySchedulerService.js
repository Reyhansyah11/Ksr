// services/expirySchedulerService.js
import memberExpiryService from "./memberExpiryService.js";

class ExpirySchedulerService {
  startExpiryChecker() {
    setInterval(async () => {
      const now = new Date();
      // Jalankan setiap hari jam 00:00
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        try {
          console.log("Memulai pengecekan member expired...");
          const expiredCount = await memberExpiryService.checkExpiredMembers();
          console.log(
            `${expiredCount} member telah dinonaktifkan karena expired`
          );

          // Cek member yang akan expired dalam 7 hari
          const nearExpiryMembers =
            await memberExpiryService.checkNearExpiryMembers();
          console.log(
            `${nearExpiryMembers.length} member akan expired dalam 7 hari`
          );
        } catch (error) {
          console.error("Error dalam proses pengecekan expired:", error);
        }
      }
    }, 60000); // Check setiap menit
  }
}

export default new ExpirySchedulerService();
