

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';
import * as mm from 'music-metadata';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload folder path - put your audio files here
const UPLOAD_FOLDER = path.join(__dirname, 'upload');

// ==========================================
// Configure Cloudinary from .env
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// ==========================================
// Song Schema (inline to avoid import issues)
// ==========================================
const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    albumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album", required: false }],
    imageUrl: { type: String, required: true },
    audioUrl: { type: String, required: true },
    duration: { type: String, required: true }
}, { timestamps: true });

const Song = mongoose.model("Song", songSchema);

/**
 * Generate canvas-based album art - EXACT same as admin.controller.js
 */
const generatePlaceholderImage = (title, artist) => {
    const canvas = createCanvas(640, 640);
    const ctx = canvas.getContext('2d');

    // Generate random colors (matching web app's createPlaceholderArtwork)
    const baseHue = Math.floor(Math.random() * 360);
    const gradient = ctx.createLinearGradient(0, 0, 640, 640);
    gradient.addColorStop(0, `hsl(${baseHue}, 70%, 20%)`);
    gradient.addColorStop(1, `hsl(${(baseHue + 45) % 360}, 70%, 45%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 640);

    // Add decorative circles
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(
            Math.random() * 640,
            Math.random() * 640,
            80 + Math.random() * 120,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Add title text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayTitle = title.length > 25 ? title.slice(0, 25) + '...' : title;
    ctx.fillText(displayTitle, 320, 300);

    // Add artist text
    const artistHue = (baseHue + 20) % 360;
    ctx.fillStyle = `hsl(${artistHue}, 60%, 80%)`;
    ctx.font = '24px sans-serif';
    const displayArtist = artist.length > 35 ? artist.slice(0, 35) + '...' : artist;
    ctx.fillText(displayArtist, 320, 360);

    return canvas.toBuffer('image/png');
};

/**
 * Extract metadata from audio file using music-metadata
 */
const extractMetadata = async (filePath) => {
    try {
        const metadata = await mm.parseFile(filePath);

        // Get title - try various tags
        let title = metadata.common.title;
        if (!title && metadata.common.album) {
            title = metadata.common.album;
        }

        // Get artist - try various tags
        let artist = metadata.common.artist;
        if (!artist && metadata.common.albumartist) {
            artist = metadata.common.albumartist;
        }
        if (!artist && metadata.common.artists && metadata.common.artists.length > 0) {
            artist = metadata.common.artists.join(', ');
        }

        return {
            title: title || null,
            artist: artist || null,
            album: metadata.common.album || null,
            duration: metadata.format.duration || null,
            picture: metadata.common.picture?.[0] || null
        };
    } catch (error) {
        console.error(`   ⚠️  Could not extract metadata: ${error.message}`);
        return { title: null, artist: null, album: null, duration: null, picture: null };
    }
};

/**
 * Format duration from seconds to MM:SS
 */
const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate title and artist from filename
 * Handles various formats:
 *   - "Artist - Title.mp3"
 *   - "Artist_-_Title.mp3" (YouTube downloads)
 *   - URL-encoded filenames like "%F0%9F%8E%B6Artist_-_Title%F0%9F%8E%B6"
 *   - "Title _ Artist.mp3"
 *   - "Title.mp3" (artist = Unknown Artist)
 */
const parseFilename = (filename) => {
    // Remove extension
    let baseName = path.basename(filename, path.extname(filename));

    // URL decode if needed (handles %F0%9F%8E%B6 etc.)
    try {
        baseName = decodeURIComponent(baseName);
    } catch (e) {
        // Not URL encoded, continue with original
    }

    // Replace underscores with spaces
    let cleanName = baseName.replace(/_/g, ' ');

    // Clean up common patterns
    cleanName = cleanName
        .replace(/\[.*?\]/g, '')           // Remove [anything]
        .replace(/\(.*?\)/g, '')           // Remove (anything) - includes (256k), (Official Video), etc.
        .replace(/^\d+\s*[-\.]\s*/, '')    // Remove track numbers like "01 - " or "01. "
        .replace(/\s*\|.*$/g, '')          // Remove everything after |
        .replace(/\s*@\w+/g, '')           // Remove @handles
        .replace(/🎶|🎵|🎧|💿|🔥|♪|♫/g, '') // Remove music emojis
        .replace(/Official\s*(Video|Audio|Music\s*Video)?/gi, '') // Remove "Official Video" etc.
        .replace(/\s*MV\s*$/i, '')         // Remove trailing MV
        .replace(/\s*Lyrics?\s*$/i, '')    // Remove trailing Lyric/Lyrics
        .replace(/\s*HQ\s*/gi, '')         // Remove HQ
        .replace(/\s*HD\s*/gi, '')         // Remove HD
        .replace(/\s*REMIX\s*/gi, ' Remix ')  // Clean up REMIX
        .replace(/\s+/g, ' ')              // Normalize multiple spaces
        .trim();

    // Try to find the separator between artist and title
    // Common separators: " - ", " – ", " — ", " _ "
    const separators = [' - ', ' – ', ' — ', ' _ '];

    for (const sep of separators) {
        if (cleanName.includes(sep)) {
            const parts = cleanName.split(sep).map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
                // Usually format is "Artist - Title"
                return {
                    artist: parts[0],
                    title: parts.slice(1).join(' - ')
                };
            }
        }
    }

    // Check for patterns like "Song Name Song Lyrics" or "Song Name Background Music"
    const titlePatterns = [
        /^(.+?)\s+Song\s*$/i,
        /^(.+?)\s+Songs?\s+.*$/i,
        /^(.+?)\s+BGM.*$/i,
        /^(.+?)\s+Background\s+Music.*$/i,
    ];

    for (const pattern of titlePatterns) {
        const match = cleanName.match(pattern);
        if (match) {
            return {
                title: match[1].trim(),
                artist: 'Unknown Artist'
            };
        }
    }

    // Fallback - use cleaned filename as title
    return {
        title: cleanName || baseName,
        artist: 'Unknown Artist'
    };
};

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (filePath, resourceType = 'auto', folder = 'songs') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: resourceType,
            folder: folder,
            chunk_size: 20 * 1024 * 1024, // 20MB chunks
            timeout: 600000, // 10 minutes timeout
        });
        return result.secure_url;
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

/**
 * Upload buffer to Cloudinary
 */
const uploadBufferToCloudinary = async (buffer, folder = 'covers') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env file');
        }
        const conn = await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

/**
 * Main seed function
 */
const seedSongs = async () => {

    // Validate Cloudinary credentials
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Cloudinary credentials not found in .env file');
        process.exit(1);
    }

    // Connect to database
    await connectDB();

    // Check if upload folder exists
    if (!fs.existsSync(UPLOAD_FOLDER)) {
        fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
        await mongoose.connection.close();
        process.exit(0);
    }

    // Get all audio files from upload folder
    const supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'];
    const files = fs.readdirSync(UPLOAD_FOLDER)
        .filter(file => supportedFormats.includes(path.extname(file).toLowerCase()))
        .sort();

    if (files.length === 0) {
        await mongoose.connection.close();
        process.exit(0);
    }

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(UPLOAD_FOLDER, file);
        try {
            // Extract metadata from audio file
            const metadata = await extractMetadata(filePath);

            // Parse filename for fallback title/artist
            const parsedFilename = parseFilename(file);

            // Use metadata if available, fallback to filename parsing
            const title = metadata.title || parsedFilename.title;
            const artist = metadata.artist || parsedFilename.artist;
            const duration = formatDuration(metadata.duration);

            // Check if song already exists (by title and artist, case-insensitive)
            const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedArtist = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const existingSong = await Song.findOne({
                title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
                artist: { $regex: new RegExp(`^${escapedArtist}$`, 'i') }
            });

            if (existingSong) {
                skipped++;
                continue;
            }

            // Upload audio to Cloudinary
            const audioUrl = await uploadToCloudinary(filePath, 'video', 'songs');

            // Generate or use embedded album art
            let imageUrl;
            if (metadata.picture && metadata.picture.data) {
                try {
                    imageUrl = await uploadBufferToCloudinary(metadata.picture.data, 'covers');
                } catch (e) {
                    const imageBuffer = generatePlaceholderImage(title, artist);
                    imageUrl = await uploadBufferToCloudinary(imageBuffer, 'covers');
                }
            } else {
                const imageBuffer = generatePlaceholderImage(title, artist);
                imageUrl = await uploadBufferToCloudinary(imageBuffer, 'covers');
            }

            // Create song in database
            const song = await Song.create({
                title,
                artist,
                imageUrl,
                audioUrl,
                duration,
                albumIds: []
            });

            uploaded++;

        } catch (error) {
            failed++;
        }
    }

    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
};

// Run the seed
seedSongs().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
