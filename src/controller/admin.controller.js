import {Song} from "../models/song.model.js"
import { Album } from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO } from "../lib/socket.js";

const uploadToCloudinary = async (file) => {
    try{
        const result =await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto"
        })
        return result.secure_url;
    }
    catch(error){
        console.error("Error in uploading to cloudinary",error);
        throw new Error("Error in uploading to cloudinary");
    }
}

const sanitizeAlbumId = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "none") return null;
    return trimmed;
};

const sanitizeOptionalString = (value) => {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed ? trimmed : undefined;
};

const processAlbumInput = (input, collector) => {
    if (Array.isArray(input)) {
        input.forEach((val) => processAlbumInput(val, collector));
        return;
    }

    if (typeof input === "string") {
        const trimmed = input.trim();
        if (!trimmed) return;

        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
            try {
                const parsed = JSON.parse(trimmed);
                processAlbumInput(parsed, collector);
                return;
            } catch (error) {
                // fall back to treating as plain string
            }
        }

        if (trimmed.includes(",")) {
            trimmed.split(",").forEach((segment) => processAlbumInput(segment, collector));
            return;
        }

        const normalized = sanitizeAlbumId(trimmed);
        if (normalized) collector.add(normalized);
        return;
    }

    if (input && typeof input === "object") {
        Object.values(input).forEach((val) => processAlbumInput(val, collector));
        return;
    }

    if (input != null) {
        const normalized = sanitizeAlbumId(String(input));
        if (normalized) collector.add(normalized);
    }
};

const extractAlbumIds = (body) => {
    const collector = new Set();
    let provided = false;

    if (body["albumIds[]"] !== undefined) {
        provided = true;
        processAlbumInput(body["albumIds[]"], collector);
    }

    if (body.albumIds !== undefined) {
        provided = true;
        processAlbumInput(body.albumIds, collector);
    }

    if (!provided && body.albumId !== undefined) {
        provided = true;
        processAlbumInput(body.albumId, collector);
    }

    if (!provided) return undefined;
    return Array.from(collector);
};

export const createSong = async(req, res,next) => {
    try {
        if(!req.files || !req.files.audioFile || !req.files.imageFile){
            return res.status(400).json({ message: "Please upload both audio and image files" });
        }

        const { title, artist, duration } = req.body;
        const albumIds = extractAlbumIds(req.body) ?? [];
        if(!title || !artist || !duration){
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;
        
        // Validate file types
        const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (!allowedAudioTypes.includes(audioFile.mimetype)) {
            return res.status(400).json({ 
                message: "Invalid audio file type. Please upload MP3, WAV, or OGG files." 
            });
        }
        
        if (!allowedImageTypes.includes(imageFile.mimetype)) {
            return res.status(400).json({ 
                message: "Invalid image file type. Please upload JPEG, JPG, or PNG images." 
            });
        }

        // Validate file sizes
        const maxAudioSize = 50 * 1024 * 1024; // 50MB
        const maxImageSize = 10 * 1024 * 1024; // 10MB for Cloudinary free tier
        
        if (audioFile.size > maxAudioSize) {
            return res.status(400).json({ 
                message: "Audio file is too large. Maximum size is 50MB." 
            });
        }
        if (imageFile.size > maxImageSize) {
            return res.status(400).json({ 
                message: "Image file is too large. Maximum size is 10MB for Cloudinary free tier. Please compress the image before uploading." 
            });
        }

        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const song = new Song({
            title,
            artist,
            albumIds,
            duration,
            audioUrl,
            imageUrl
        });

        await song.save();

        if(albumIds.length){
            await Album.updateMany(
                { _id: { $in: albumIds } },
                { $addToSet: { songs: song._id } }
            );
        }

        res.status(201).json({ 
            message: "Song created successfully",
            song: {
                _id: song._id,
                title: song.title,
                artist: song.artist,
                albumIds: song.albumIds,
                duration: song.duration,
                audioUrl: song.audioUrl,
                imageUrl: song.imageUrl
            }
        });
    }
    catch(error){
        res.status(500).json({ 
            message: error.message || "Error creating song",
            error: error.message 
        });
    }
}

export const deleteSong = async(req, res,next) => {
    try{
        const { id } = req.params;
        const song = await Song.findById(id);
        if(!song){
            return res.status(404).json({ message: "Song not found" });
        }
        const albumIds = song.albumIds ?? [];
        if(albumIds.length){
            await Album.updateMany(
                { _id: { $in: albumIds } },
                { $pull: { songs: id } }
            );
        }
        await Song.findByIdAndDelete(id);
        res.status(200).json({ message: "Song deleted successfully" });
    }
    catch(error){
        console.error("Error in deleting song",error);
        next(error);
    }
}

export const updateSong = async (req, res, next) => {
    try {
        const { id } = req.params;
        const song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        const { title, artist, duration } = req.body;
        const extractedAlbumIds = extractAlbumIds(req.body);

        if (req.files?.audioFile) {
            song.audioUrl = await uploadToCloudinary(req.files.audioFile);
        }

        if (req.files?.imageFile) {
            song.imageUrl = await uploadToCloudinary(req.files.imageFile);
        }

        if (title) song.title = title;
        if (artist) song.artist = artist;
        if (duration) song.duration = duration;

        if (extractedAlbumIds) {
            const previousIds = (song.albumIds || []).map((album) => album.toString());
            const nextIds = extractedAlbumIds;

            const toRemove = previousIds.filter((albumId) => !nextIds.includes(albumId));
            const toAdd = nextIds.filter((albumId) => !previousIds.includes(albumId));

            if (toRemove.length) {
                await Album.updateMany(
                    { _id: { $in: toRemove } },
                    { $pull: { songs: song._id } }
                );
            }

            if (toAdd.length) {
                const validAlbums = await Album.find({ _id: { $in: toAdd } }, { _id: 1 });
                const validIds = validAlbums.map((album) => album._id.toString());

                if (validIds.length !== toAdd.length) {
                    return res.status(404).json({ message: "One or more selected albums do not exist" });
                }

                await Album.updateMany(
                    { _id: { $in: validIds } },
                    { $addToSet: { songs: song._id } }
                );
            }

            song.albumIds = nextIds;
        }

        const updatedSong = await song.save();

        res.status(200).json({
            message: "Song updated successfully",
            song: updatedSong,
        });
    } catch (error) {
        console.error("Error updating song", error);
        next(error);
    }
};

export const createAlbum = async(req, res,next) => {
    try {
        if(!req.files || !req.files.imageFile){
            return res.status(400).json({ message: "Please upload an image" });
        }

        const { title, artist, releaseYear } = req.body;
        if(!title || !artist || !releaseYear){
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const imageFile = req.files.imageFile;
        
        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedImageTypes.includes(imageFile.mimetype)) {
            return res.status(400).json({ 
                message: "Invalid image file type. Please upload JPEG, JPG, or PNG images." 
            });
        }

        // Validate file size
        const maxImageSize = 10 * 1024 * 1024; // 10MB for Cloudinary free tier
        if (imageFile.size > maxImageSize) {
            return res.status(400).json({ 
                message: "Image file is too large. Maximum size is 10MB for Cloudinary free tier. Please compress the image before uploading." 
            });
        }

        const imageUrl = await uploadToCloudinary(imageFile);

        const album = new Album({
            title,
            artist,
            releaseYear: parseInt(releaseYear),
            imageUrl,
            songs: []
        });

        await album.save();

        res.status(201).json({ 
            message: "Album created successfully",
            album: {
                _id: album._id,
                title: album.title,
                artist: album.artist,
                releaseYear: album.releaseYear,
                imageUrl: album.imageUrl,
                songs: album.songs
            }
        });
    }
    catch(error){
        res.status(500).json({ 
            message: error.message || "Error creating album",
            error: error.message 
        });
    }
}

export const deleteAlbum = async(req, res,next) => {
    try{
        const {id} = req.params;
        await Song.updateMany({albumIds: id}, {$pull: {albumIds: id}});
        await Album.findByIdAndDelete(id);
        res.status(200).json({ message: "Album deleted successfully" });
    }
    catch(error){
        console.error("Error in deleting album",error);
        next(error);
    }
}

export const updateAlbum = async (req, res, next) => {
    try {
        const { id } = req.params;
        const album = await Album.findById(id);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        const { title, artist, releaseYear } = req.body;

        if (req.files?.imageFile) {
            album.imageUrl = await uploadToCloudinary(req.files.imageFile);
        }

        if (title) album.title = title;
        if (artist) album.artist = artist;
        if (releaseYear) album.releaseYear = parseInt(releaseYear, 10);

        const updatedAlbum = await album.save();

        res.status(200).json({
            message: "Album updated successfully",
            album: updatedAlbum,
        });
    } catch (error) {
        console.error("Error updating album", error);
        next(error);
    }
};

export const sendBroadcastNotification = async (req, res, next) => {
	try {
		const title = sanitizeOptionalString(req.body?.title);
		const message = sanitizeOptionalString(req.body?.message);
		const imageUrl = sanitizeOptionalString(req.body?.imageUrl);
		const link = sanitizeOptionalString(req.body?.link);

		if (!message) {
			return res.status(400).json({ message: "Message is required" });
		}

		const io = getIO();
		if (!io) {
			return res.status(500).json({ message: "Notification service unavailable" });
		}

		const payload = {
			id: Date.now().toString(),
			title,
			message,
			imageUrl,
			link,
			createdAt: new Date().toISOString(),
		};

		console.log("Emitting broadcast_notification to all clients:", payload);
		io.emit("broadcast_notification", payload);
		return res.status(200).json({ message: "Notification sent" });
	} catch (error) {
		next(error);
	}
};

export const checkAdmin = async(req, res,next) => {
    res.status(200).json({ admin: true });
    console.log("Admin check successful")
}

export const assignSongsToAlbum = async (req, res, next) => {
    try {
        const { id: albumId } = req.params;
        const { songIds } = req.body;

        if (!Array.isArray(songIds) || songIds.length === 0) {
            return res.status(400).json({ message: "Please provide songs to assign" });
        }

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        const songs = await Song.find({ _id: { $in: songIds } });
        if (!songs.length) {
            return res.status(404).json({ message: "No matching songs found" });
        }

        const validSongIds = songs.map((song) => song._id.toString());

        await Song.updateMany(
            { _id: { $in: validSongIds } },
            { $addToSet: { albumIds: albumId } }
        );

        await Album.findByIdAndUpdate(albumId, {
            $addToSet: { songs: { $each: validSongIds } },
        });

        const updatedAlbum = await Album.findById(albumId).populate("songs");

        res.status(200).json({
            message: "Songs assigned to album",
            album: updatedAlbum,
        });
    } catch (error) {
        console.error("Error assigning songs to album", error);
        next(error);
    }
};