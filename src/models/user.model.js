import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,  // Optional for Clerk users, required for mobile users
        sparse: true,     // Allows multiple nulls
        index: true
    },
    image: {
        type: String,
        required: false,
        default: ''
    },
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
    likedSongs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Song"
        }
    ],
    lastSeen: {
        type: Date
    },
    settings: {
        playback: {
            shuffle: { type: Boolean, default: false },
            loop: { type: Boolean, default: false },
            volume: { type: Number, default: 0.7, min: 0, max: 1 },
            audioQuality: { type: String, enum: ['low', 'normal', 'high'], default: 'high' },
            crossfade: { type: Boolean, default: false },
            gaplessPlayback: { type: Boolean, default: true },
            normalizeVolume: { type: Boolean, default: false }
        },
        display: {
            theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
            accentColor: { type: String, enum: ['emerald', 'green', 'blue', 'purple', 'pink', 'orange'], default: 'emerald' },
            compactMode: { type: Boolean, default: false },
            layout: { type: String, enum: ['default', 'compact', 'comfortable'], default: 'default' }
        },
        downloads: {
            downloadQuality: { type: String, enum: ['low', 'normal', 'high'], default: 'high' },
            downloadOverWifi: { type: Boolean, default: true },
            autoDownload: { type: Boolean, default: false }
        },
        privacy: {
            profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
            showListeningActivity: { type: Boolean, default: true },
            allowFriendRequests: { type: Boolean, default: true }
        },
        notifications: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: false },
            newReleases: { type: Boolean, default: true },
            friendActivity: { type: Boolean, default: true }
        }
    }
}, { timestamps: true });


export const User = mongoose.model("User", userSchema)
