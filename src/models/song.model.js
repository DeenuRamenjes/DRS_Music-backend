import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist:{
        type:String,
        required:true
    },
    albumIds:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Album",
            required:false
        }
    ],
    imageUrl:{
        type:String,
        required:true
    },
    audioUrl:{
        type:String,
        required:true
    },
    duration:{
        type:String,
        required:true
    }
},{timestamps:true})


export const Song = mongoose.model("Song", songSchema)
