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
        return `backup_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}.sql`;
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
            console.log('Memulai restore backup dari:', backupFilePath);
            
            const command = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} < "${backupFilePath}"`;
            
            console.log('Perintah MySQL:', command);
    
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Restore error: ${error}`);
                    console.error(`stderr: ${stderr}`);
                    reject(error);
                    return;
                }
                
                console.log('Database restored successfully');
                console.log(`stdout: ${stdout}`);
                
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
        // Jalankan backup setiap hari jam 1 pagi
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            1, // 1 AM
            0,
            0
        );
        
        const msUntilNight = night.getTime() - now.getTime();
        
        // Schedule first backup
        setTimeout(() => {
            this.createDailyBackup();
            // Selanjutnya jalankan setiap 24 jam
            setInterval(() => this.createDailyBackup(), 24 * 60 * 60 * 1000);
        }, msUntilNight);
    }
}

export default DatabaseBackupService;