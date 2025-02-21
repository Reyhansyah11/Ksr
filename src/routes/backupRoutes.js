import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DatabaseBackupService from '../services/DatabaseBackupService.js';
import { authenticateUser } from '../middleware/authenticate.js';


const router = express.Router();
const backupService = new DatabaseBackupService();

router.use(authenticateUser);
// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, backupService.backupDir);
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) !== '.sql') {
            return cb(new Error('Hanya file .sql yang diperbolehkan'));
        }
        cb(null, true);
    }
});

// Endpoint untuk mendapatkan daftar backup yang tersedia
router.get('/backups', async (req, res) => {
    try {
        const backups = backupService.getAvailableBackups();
        res.json({ 
            backups,
            count: backups.length,
            backupDirectory: backupService.backupDir
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal mendapatkan daftar backup',
            error: error.message 
        });
    }
});

// Endpoint untuk melakukan backup manual
router.post('/backup', async (req, res) => {
    try {
        const backupPath = await backupService.createDailyBackup();
        res.json({ 
            message: 'Backup berhasil dibuat',
            backupPath
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal membuat backup',
            error: error.message 
        });
    }
});

// Endpoint untuk import database dari file backup yang dipilih
router.post('/import/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validasi filename
        if (!filename) {
            return res.status(400).json({ message: 'Nama file diperlukan' });
        }

        // Buat path lengkap ke file backup
        const backupPath = path.join(backupService.backupDir, filename);
        
        // Cek apakah file exists
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ message: 'File backup tidak ditemukan' });
        }

        // Jalankan proses import
        await backupService.restoreBackup(backupPath);
        
        res.json({ 
            success: true,
            message: 'Database berhasil diimport',
            filename: filename
        });
    } catch (error) {
        console.error('Error saat import database:', error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal mengimport database',
            error: error.message 
        });
    }
});

// Endpoint untuk restore database
router.post('/restore', upload.single('backup'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File backup tidak ditemukan' });
        }

        await backupService.restoreBackup(req.file.path);
        res.json({ message: 'Database berhasil direstore' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal melakukan restore database', error: error.message });
    }
});

// Endpoint untuk rollback ke tanggal tertentu
router.post('/rollback', async (req, res) => {
    try {
        const { date } = req.body;
        
        if (!date) {
            return res.status(400).json({ message: 'Tanggal rollback diperlukan' });
        }
        
        // Parse tanggal dari format YYYY-MM-DD
        const [year, month, day] = date.split('-');
        const rollbackDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Validasi tanggal
        if (isNaN(rollbackDate.getTime())) {
            return res.status(400).json({ message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD' });
        }
        
        const result = await backupService.rollbackToDate(rollbackDate);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal melakukan rollback database',
            error: error.message 
        });
    }
});

export default router;