// backend/index.js

const express = require('express');
const cors = require('cors');
// ... (all other require statements)
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();
// ... (rest of the setup code is the same)

// --- API Routes ---

// Upload files and create a share record
app.post('/api/upload', upload.array('files'), async (req, res) => {
    // ...
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const filenamesArray = req.files.map(f => f.filename);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const newShare = await prisma.share.create({
            data: {
                otp: otp,
                filenames: JSON.stringify(filenamesArray), // Convert array to JSON string
                expiresAt: expiresAt,
                burnAfterDownload: req.body.burnAfterDownload === 'true',
            },
        });
        
        res.status(200).json({ otp: newShare.otp });
    } catch (error) {
        // ... (error handling is the same)
    }
});

// Verify OTP and serve files as a zip archive
app.post('/api/download', async (req, res) => {
    try {
        const { otp } = req.body;
        // ... (OTP check is the same)
        const share = await prisma.share.findUnique({ where: { otp: otp } });

        if (!share || share.expiresAt < new Date()) {
            // ... (error handling is the same)
        }

        res.attachment('DashDrop-files.zip');
        const archive = archiver('zip');
        archive.pipe(res);

        const filenames = JSON.parse(share.filenames); // Convert JSON string back to array
        for (const filename of filenames) {
            const filePath = path.join(__dirname, 'uploads', filename);
            if (fs.existsSync(filePath)) archive.file(filePath, { name: filename });
        }

        await archive.finalize();

        if (share.burnAfterDownload) {
            // ... (deletion logic is the same)
        }
    } catch (error) {
        // ... (error handling is the same)
    }
});

// --- Serve Static Frontend Files ---
// ... (rest of the file is the same)
