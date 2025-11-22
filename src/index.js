import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import { clerkMiddleware } from '@clerk/express'
import fileUpload from 'express-fileupload';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './lib/socket.js';
import cron from 'node-cron';
import fs from 'fs';

const __dirname = path.resolve();

dotenv.config();
const app = express();

const httpServer=createServer(app);
initializeSocket(httpServer);

// const allowedOrigins = [
//     'http://localhost:4000',
//     'http://127.0.0.1:4000',
//     'http://localhost:5173',
//     'http://127.0.0.1:5173',
//     'https://spotify-chat-jqzp.onrender.com',
// ];

const allowedOrigins = [
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',  // Add this for Replit web testing
    'https://spotify-chat-jqzp.onrender.com',
    'https://*.riker.replit.dev',  // Add this to whitelist all Replit dev domains
];

if (process.env.LOCAL_IP) {
    allowedOrigins.push(`http://${process.env.LOCAL_IP}:4000`);
}

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

allowedOrigins.push(...extraOrigins);

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors(
    {
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (!isProduction) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.warn('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true
    }
));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(clerkMiddleware())

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure file upload middleware
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: tempDir,
    createParentPath: true,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50 MB
        files: 2 // Maximum number of files
    },
    abortOnLimit: false, // Don't abort on limit, return error instead
    safeFileNames: true,
    preserveExtension: true,
    debug: process.env.NODE_ENV === 'development',
    parseNested: true // Enable nested form data parsing
}));

// Error handler for file upload limits
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'File size is too large. Maximum size is 50MB.'
        });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            message: 'Too many files. Maximum 2 files allowed.'
        });
    }
    if (err.message === 'Request is not eligible for file upload!') {
        return res.status(400).json({
            message: 'Invalid request format. Please ensure you are sending files as multipart/form-data.'
        });
    }
    next(err);
});

// Clean up temp files every hour
cron.schedule("0 * * * *", () => {
    if (fs.existsSync(tempDir)) {
        fs.readdir(tempDir, (err, files) => {
            if (err) {
                console.error("Error reading temp directory:", err);
                return;
            }
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error("Error deleting temp file:", err);
                    }
                });
            }
        });
    }
});

//Routes
import userRoute from './routes/user.route.js';
import authRoute from './routes/auth.route.js';
import adminRoute from './routes/admin.route.js';
import songsRoute from './routes/songs.route.js';
import albumRoute from './routes/album.route.js';
import statsRoute from './routes/stats.route.js';





app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);
app.use('/api/songs', songsRoute);
app.use('/api/album', albumRoute);
app.use('/api/stats', statsRoute);


// if(process.env.NODE_ENV === 'production'){
//     app.use(express.static(path.join(__dirname, "../frontend/dist")));
//     app.get("*",(req,res)=>{
//         res.sendFile(path.join(__dirname, "../frontend","dist","index.html"));
//     })
// }




//error handling middleware
app.use((err, req, res, next) => {
    console.error("Error in middleware", err.message);
    res.status(500).json({ 
        message:process.env.NODE_ENV === 'production' ? "Internal Server Error" : err.message,
    });
})





const PORT= process.env.PORT


app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('================================');
    console.log(`Server is running on Port ${PORT}`);
    console.log('================================');
    connectDB();
})