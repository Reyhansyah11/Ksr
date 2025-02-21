async getCombinedReport(req, res) {
    try {
      const toko_id = req.user.toko_id;
      let { startDate, endDate } = req.query;
  
      const startDateTime = new Date(startDate + 'T00:00:00.000+07:00');
      const endDateTime = new Date(endDate + 'T23:59:59.999+07:00');
  
      // 1. Ambil total pembelian langsung dari tabel Pembelian
      const purchaseTotal = await Pembelian.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total')), 'total_pembelian']
        ],
        where: {
          toko_id,
          tanggal_pembelian: {
            [Op.between]: [startDateTime, endDateTime]
          }
        },
        raw: true
      });
  
      // 2. Ambil data detail pembelian untuk informasi per produk
      const purchaseData = await PembelianDetail.findAll({
        attributes: [
          'product_id',
          [Sequelize.fn('SUM', Sequelize.col('pembelian_detail.qty')), 'total_qty'],
          [Sequelize.literal('pembelian_detail.harga_beli / product.isi'), 'harga_satuan']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'isi'],
            required: true,
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['category_name']
              }
            ]
          },
          {
            model: Pembelian,
            as: 'pembelian',
            attributes: [],
            where: {
              toko_id,
              tanggal_pembelian: {
                [Op.between]: [startDateTime, endDateTime]
              }
            }
          }
        ],
        group: [
          'product_id', 
          'product.product_id', 
          'product.category.category_id',
          'pembelian_detail.harga_beli',
          'product.isi'
        ],
        raw: true,
        nest: true
      });
  
      // 3. Ambil data penjualan dengan detail produk
      const salesData = await PenjualanDetail.findAll({
        attributes: [
          'product_id',
          [Sequelize.fn('SUM', Sequelize.col('penjualan_detail.qty')), 'total_qty'],
          [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * penjualan_detail.harga_jual')), 'total_penjualan'],
          [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * (penjualan_detail.harga_beli / product.isi)')), 'total_hpp']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'isi'],
            required: true,
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['category_name']
              }
            ]
          },
          {
            model: Penjualan,
            as: 'penjualan',
            attributes: [],
            where: {
              toko_id,
              tanggal_penjualan: {
                [Op.between]: [startDateTime, endDateTime]
              }
            }
          }
        ],
        group: [
          'product_id', 
          'product.product_id', 
          'product.category.category_id'
        ],
        raw: true,
        nest: true
      });
  
      // 4. Gabungkan data per kategori
      const categoryReport = {};
      
      // Proses data pembelian per kategori
      purchaseData.forEach(item => {
        const category = item.product.category.category_name;
        if (!categoryReport[category]) {
          categoryReport[category] = {
            pembelian: { qty: 0, total: 0 },
            penjualan: { qty: 0, total: 0 },
            hpp: 0,
            laba: 0,
            products: []
          };
        }
  
        // Konversi qty pembelian dari dus ke pcs
        const qtyInPcs = parseInt(item.total_qty) * item.product.isi;
        
        // Update qty dalam pcs
        categoryReport[category].pembelian.qty += parseInt(item.total_qty);
  
        // Simpan data produk
        categoryReport[category].products.push({
          nama_produk: item.product.product_name,
          pembelian: {
            qty: qtyInPcs,
            harga_satuan: parseFloat(item.harga_satuan)
          },
          penjualan: { qty: 0, total: 0 },
          hpp: 0,
          laba: 0
        });
      });
  
      // Proses data penjualan per kategori
      salesData.forEach(item => {
        const category = item.product.category.category_name;
        if (!categoryReport[category]) {
          categoryReport[category] = {
            pembelian: { qty: 0, total: 0 },
            penjualan: { qty: 0, total: 0 },
            hpp: 0,
            laba: 0,
            products: []
          };
        }
  
        // Update data penjualan
        categoryReport[category].penjualan.qty += parseInt(item.total_qty);
        categoryReport[category].penjualan.total += parseInt(item.total_penjualan);
        categoryReport[category].hpp += parseInt(item.total_hpp);
        
        // Update product detail
        const productIndex = categoryReport[category].products.findIndex(
          p => p.nama_produk === item.product.product_name
        );
        
        if (productIndex >= 0) {
          categoryReport[category].products[productIndex].penjualan = {
            qty: parseInt(item.total_qty),
            total: parseInt(item.total_penjualan)
          };
          categoryReport[category].products[productIndex].hpp = parseInt(item.total_hpp);
          categoryReport[category].products[productIndex].laba = 
            parseInt(item.total_penjualan) - parseInt(item.total_hpp);
        } else {
          categoryReport[category].products.push({
            nama_produk: item.product.product_name,
            pembelian: { qty: 0 },
            penjualan: {
              qty: parseInt(item.total_qty),
              total: parseInt(item.total_penjualan)
            },
            hpp: parseInt(item.total_hpp),
            laba: parseInt(item.total_penjualan) - parseInt(item.total_hpp)
          });
        }
      });
  
      // Hitung laba per kategori
      Object.keys(categoryReport).forEach(category => {
        categoryReport[category].laba = 
          categoryReport[category].penjualan.total - categoryReport[category].hpp;
      });
  
      // 5. Hitung ringkasan total
      const ringkasan = {
        pembelian: {
          qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.pembelian.qty, 0),
          total: parseFloat(purchaseTotal.total_pembelian) || 0  // Gunakan total dari tabel pembelian
        },
        penjualan: {
          qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.qty, 0),
          total: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.total, 0)
        },
        hpp: Object.values(categoryReport).reduce((sum, cat) => sum + cat.hpp, 0),
        laba: Object.values(categoryReport).reduce((sum, cat) => sum + cat.laba, 0)
      };
  
      // Hitung margin dan persentase pencapaian
      ringkasan.margin = ringkasan.hpp > 0 
        ? ((ringkasan.laba / ringkasan.hpp) * 100).toFixed(2)
        : 0;
  
      ringkasan.selisih_pembelian_penjualan = ringkasan.pembelian.total - ringkasan.penjualan.total;
      ringkasan.persentase_pencapaian = ((ringkasan.penjualan.total / ringkasan.pembelian.total) * 100).toFixed(2);
  
      res.json({
        status: "success",
        data: {
          detail_kategori: categoryReport,
          ringkasan,
          periode: {
            tanggal_mulai: startDateTime,
            tanggal_akhir: endDateTime
          }
        }
      });
  
    } catch (error) {
      console.error("Error in getCombinedReport:", error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }



  import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseBackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'reyyy',
            database: 'POS'
        };
        this.initBackupDirectory();
    }

    initBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    generateBackupFileName() {
        const date = new Date();
        const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
        return `backup_${timestamp}.sql`;
    }

    async createDailyBackup() {
        try {
            const backupFile = path.join(this.backupDir, this.generateBackupFileName());
            const command = `mysqldump -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} > "${backupFile}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Backup error: ${error}`);
                    return;
                }
                console.log(`Backup created successfully at ${backupFile}`);
            });
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
    }

    async restoreBackup(backupFilePath) {
        return new Promise((resolve, reject) => {
            const command = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} < "${backupFilePath}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Restore error: ${error}`);
                    reject(error);
                    return;
                }
                console.log('Database restored successfully');
                resolve(true);
            });
        });
    }

    scheduleBackup() {
        // Jalankan backup setiap 1 menit untuk testing
        console.log('Memulai backup scheduler setiap 1 menit...');
        this.createDailyBackup(); // Jalankan backup pertama segera
        setInterval(() => {
            this.createDailyBackup();
        }, 60000); // 60000 ms = 1 menit
    }
}

export default DatabaseBackupService;



import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseBackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'reyyy',
            database: 'test_rollback'
        };
        this.initBackupDirectory();
    }

    initBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    generateBackupFileName() {
        const date = new Date();
        return `backup_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.sql`;
    }

    async createDailyBackup() {
        try {
            const backupFile = path.join(this.backupDir, this.generateBackupFileName());
            const command = `mysqldump -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} > "${backupFile}"`;

            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Backup error: ${error}`);
                        reject(error);
                        return;
                    }
                    console.log(`Daily backup created successfully at ${backupFile}`);
                    resolve(backupFile);
                });
            });
        } catch (error) {
            console.error('Failed to create daily backup:', error);
            throw error;
        }
    }

    async restoreBackup(backupFilePath) {
        return new Promise((resolve, reject) => {
            const command = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} < "${backupFilePath}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Restore error: ${error}`);
                    reject(error);
                    return;
                }
                console.log('Database restored successfully');
                resolve(true);
            });
        });
    }

    async rollbackToDate(date) {
        try {
            // Format tanggal untuk mencari file backup
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const targetFileName = `backup_${year}${month}${day}.sql`;
            const backupFilePath = path.join(this.backupDir, targetFileName);

            // Periksa apakah file backup untuk tanggal tersebut ada
            if (!fs.existsSync(backupFilePath)) {
                throw new Error(`Backup untuk tanggal ${year}-${month}-${day} tidak ditemukan`);
            }

            // Lakukan restore dari backup
            await this.restoreBackup(backupFilePath);
            return {
                success: true,
                message: `Database berhasil di-rollback ke tanggal ${year}-${month}-${day}`,
                backupUsed: targetFileName
            };
        } catch (error) {
            console.error('Rollback error:', error);
            throw error;
        }
    }

    getAvailableBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            
            // Filter hanya file .sql dan susun berdasarkan tanggal
            return files
                .filter(file => file.endsWith('.sql') && file.startsWith('backup_'))
                .map(file => {
                    const stats = fs.statSync(path.join(this.backupDir, file));
                    // Extract date from filename (backup_YYYYMMDD.sql)
                    const dateStr = file.substring(7, 15);
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    
                    return {
                        filename: file,
                        path: path.join(this.backupDir, file),
                        date: `${year}-${month}-${day}`,
                        size: stats.size,
                        created: stats.mtime
                    };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
        } catch (error) {
            console.error('Failed to get available backups:', error);
            throw error;
        }
    }

    scheduleBackup() {
        // Jalankan backup setiap 1 menit untuk testing
        console.log('Memulai backup scheduler setiap 1 menit...');
        this.createDailyBackup(); // Jalankan backup pertama segera
        setInterval(() => {
            this.createDailyBackup();
        }, 60000); // 60000 ms = 1 menit
    }
}

export default DatabaseBackupService;