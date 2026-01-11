import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,  // Optional for users without email
        sparse: true,     // Allows multiple nulls/empty strings
        unique: true,     // Prevent duplicate emails
        index: true
    },
    password: {
        type: String,
        required: false,  // Optional - Google users won't have password
    },
    image: {
        type: String,
        required: false,
        default: ''
    },
    googleId: {
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
    isAdmin: {
        type: Boolean,
        default: false,
        index: true
    },
    settings: {
        playback: {
            shuffle: { type: Boolean, default: false },
            loop: { type: Boolean, default: false },
            volume: { type: Number, default: 0.7, min: 0, max: 1 },
            audioQuality: { type: String, enum: ['low', 'normal', 'high'], default: 'high' },
            crossfade: { type: Boolean, default: false },
            gaplessPlayback: { type: Boolean, default: true },
            normalizeVolume: { type: Boolean, default: false },
            equalizerEnabled: { type: Boolean, default: false },
            equalizerPreset: {
                type: String,
                enum: ['flat', 'bass', 'treble', 'vocal', 'rock', 'pop', 'jazz', 'classical', 'custom'],
                default: 'flat'
            },
            customBands: {
                band60Hz: { type: Number, default: 0, min: -12, max: 12 },
                band230Hz: { type: Number, default: 0, min: -12, max: 12 },
                band910Hz: { type: Number, default: 0, min: -12, max: 12 },
                band3600Hz: { type: Number, default: 0, min: -12, max: 12 },
                band14000Hz: { type: Number, default: 0, min: -12, max: 12 }
            }
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
