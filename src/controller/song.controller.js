import { Song } from "../models/song.model.js";


export const getAllSong = async(req, res, next) => {
    try{
        const songs =await Song.find().sort({createdAt:-1})
        res.json(songs)
    }
    catch(err){
        console.error("Error in getAllSong", err.message);
        next(err);
    }
}

export const getFeaturedSong = async(req, res, next) => {
    try{
        const songs =await Song.aggregate([
            { 
                $sample: { size: 6 } 
            }, // Randomly select 6 songs
            { 
                $project: { 
                    _id: 1,
                    title: 1, 
                    artist: 1, 
                    imageUrl: 1,
                    audioUrl: 1
                }
            } 
        ])
        res.json(songs)
    }
    catch(err){
        console.error("Error in getFeaturedSong", err.message);
        next(err);
    }
}

export const getMadeForYouSong = async(req, res, next) => {
    try{
        const songs =await Song.aggregate([
            { 
                $sample: { size: 4 } 
            }, // Randomly select 4 songs
            { 
                $project: { 
                    _id: 1,
                    title: 1, 
                    artist: 1, 
                    imageUrl: 1,
                    audioUrl: 1
                }
            } 
        ])
        res.json(songs)
    }
    catch(err){
        console.error("Error in getFeaturedSong", err.message);
        next(err);
    }
}

export const getSongById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const song = await Song.findById(id);

        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        res.json(song);
    }
    catch (err) {
        console.error("Error in getSongById", err.message);
        next(err);
    }
}

export const searchSongs = async (req, res, next) => {
    try {
        const { q = "" } = req.query;
        const query = q.trim();

        if (!query) {
            return res.json([]);
        }

        const songs = await Song.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { artist: { $regex: query, $options: "i" } }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(25);

        res.json(songs);
    }
    catch (err) {
        console.error("Error in searchSongs", err.message);
        next(err);
    }
}

export const getTreandingSong = async(req, res, next) => {
    try{
        const songs =await Song.aggregate([
            { 
                $sample: { size: 4 } 
            }, // Randomly select 4 songs
            { 
                $project: { 
                    _id: 1,
                    title: 1, 
                    artist: 1, 
                    imageUrl: 1,
                    audioUrl: 1
                }
            } 
        ])
        res.json(songs)
    }
    catch(err){
        console.error("Error in getFeaturedSong", err.message);
        next(err);
    }
}