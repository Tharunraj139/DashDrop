// backend/index.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// --- Create 'uploads' directory if it doesn't exist ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- File Storage Configuration (using Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
});

const upload = multer({ storage: storage });

// --- API Routes ---

// @route   POST /api/upload
// @desc    Uploads files and creates a share record in the database
app.post('/api/upload', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const filenames = req.files.map(f => f.filename);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        const newShare = await prisma.share.create({
            data: {
                otp: otp,
                filenames: filenames,
                expiresAt: expiresAt,
                burnAfterDownload: req.body.burnAfterDownload === 'true', // Handle this from frontend
            },
        });
        
        console.log(`Created share with OTP: ${newShare.otp}`);
        res.status(200).json({
            message: 'Files uploaded successfully!',
            otp: newShare.otp,
        });

    } catch (error) {
        console.error("Error creating share record:", error);
        res.status(500).json({ error: "Could not create share link." });
    }
});


// @route   POST /api/download
// @desc    Verifies OTP and serves files as a zip archive
app.post('/api/download', async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ error: 'OTP is required.' });
        }

        const share = await prisma.share.findUnique({ where: { otp: otp } });

        if (!share || share.expiresAt < new Date()) {
            return res.status(404).json({ error: 'Invalid OTP or link has expired.' });
        }

        res.attachment('DashDrop-files.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        for (const filename of share.filenames) {
            const filePath = path.join(__dirname, 'uploads', filename);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: filename });
            }
        }

        await archive.finalize();

        if (share.burnAfterDownload) {
            for (const filename of share.filenames) {
                const filePath = path.join(__dirname, 'uploads', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await prisma.share.delete({ where: { id: share.id } });
            console.log(`Burned share with OTP: ${otp}`);
        }

    } catch (error) {
        console.error("Error during download:", error);
        res.status(500).json({ error: "Could not process download." });
    }
});


// --- Serve Static Frontend Files ---
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    // --- Catch-all route to serve index.html for any other request ---
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ Server started successfully on port ${PORT}`);
    console.log(`It's currently ${new Date().toLocaleTimeString()} here in Hyderabad.`);
});