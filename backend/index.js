// backend/index.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001; // Port for our backend server

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
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
});

const upload = multer({ storage: storage });

// --- API Routes ---

app.get('/', (req, res) => {
    res.send('DashDrop Backend Server is running!');
});

app.post('/api/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    console.log('Files received:', req.files.map(f => f.filename));

    res.status(200).json({
        message: 'Files uploaded successfully!',
        files: req.files.map(f => f.filename),
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ Backend server started successfully at http://localhost:${PORT}`);
    console.log(`It's currently ${new Date().toLocaleTimeString()} here in Hyderabad.`);
});