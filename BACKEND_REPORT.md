# 📋 DRS Music Backend - Complete Technical Report

**Generated:** December 6, 2025  
**Version:** 1.0.0  

---

## 📁 Project Overview

| Property | Value |
|----------|-------|
| **Project Name** | DRS Music Backend |
| **Type** | RESTful API Backend for Music Streaming |
| **Technology Stack** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Clerk Authentication |
| **File Storage** | Cloudinary |
| **Real-time Communication** | Socket.IO |

---

## 🏗️ Architecture Overview

### Directory Structure
```
DRS_Music-backend/
├── src/
│   ├── index.js              # Main entry point
│   ├── controller/           # Business logic controllers
│   │   ├── admin.controller.js
│   │   ├── album.controller.js
│   │   ├── auth.controller.js
│   │   ├── song.controller.js
│   │   ├── stats.controller.js
│   │   └── user.controller.js
│   ├── controllers/          # Additional controllers
│   │   └── todo.controller.js
│   ├── lib/                  # Core libraries
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── socket.js
│   ├── middleware/           # Express middleware
│   │   ├── asyncHandler.js
│   │   └── auth.middleware.js
│   ├── models/               # MongoDB schemas
│   │   ├── album.model.js
│   │   ├── message.model.js
│   │   ├── song.model.js
│   │   ├── todo.model.js
│   │   └── user.model.js
│   ├── routes/               # API route definitions
│   │   ├── admin.route.js
│   │   ├── album.route.js
│   │   ├── auth.route.js
│   │   ├── songs.route.js
│   │   ├── stats.route.js
│   │   ├── todo.routes.js
│   │   └── user.route.js
│   ├── scripts/              # Utility scripts
│   │   └── seedSongs.js
│   ├── seeds/                # Database seeding
│   │   ├── albums.js
│   │   └── songs.js
│   └── utils/                # Utility functions
│       └── sanitize.js
├── package.json
├── .env
└── temp/                     # Temporary file storage
```

---

## 📦 Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web framework |
| `mongoose` | ^8.13.1 | MongoDB ODM |
| `@clerk/express` | ^1.3.59 | Authentication middleware |
| `cloudinary` | ^1.41.3 | Cloud media storage |
| `socket.io` | ^4.8.1 | Real-time WebSocket communication |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^16.4.7 | Environment variable management |
| `express-fileupload` | ^1.5.1 | File upload middleware |
| `axios` | ^1.13.2 | HTTP client |
| `assemblyai` | ^4.19.0 | Audio transcription/lyrics |
| `multer` | ^2.0.2 | File upload handling |
| `music-metadata` | ^11.0.5 | Audio file metadata extraction |
| `node-cron` | ^3.0.3 | Scheduled task management |
| `jsonwebtoken` | ^9.0.2 | JWT token handling |
| `form-data` | ^4.0.5 | Form data handling |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.1.9 | Auto-restart for development |

---

## 🗄️ Database Models

### 1. User Model (`user.model.js`)

Stores user profiles with comprehensive settings.

```javascript
{
  name: String (required),
  image: String (required),
  clerkId: String (required, unique),
  likedSongs: [ObjectId → Song],
  lastSeen: Date,
  settings: {
    playback: {
      shuffle: Boolean (default: false),
      loop: Boolean (default: false),
      volume: Number (0-1, default: 0.7),
      audioQuality: Enum['low', 'normal', 'high'] (default: 'high'),
      crossfade: Boolean (default: false),
      gaplessPlayback: Boolean (default: true),
      normalizeVolume: Boolean (default: false)
    },
    display: {
      theme: Enum['dark', 'light', 'system'] (default: 'dark'),
      accentColor: Enum['emerald', 'green', 'blue', 'purple', 'pink', 'orange'],
      compactMode: Boolean,
      layout: Enum['default', 'compact', 'comfortable']
    },
    downloads: {
      downloadQuality: Enum['low', 'normal', 'high'],
      downloadOverWifi: Boolean,
      autoDownload: Boolean
    },
    privacy: {
      profileVisibility: Enum['public', 'friends', 'private'],
      showListeningActivity: Boolean,
      allowFriendRequests: Boolean
    },
    notifications: {
      emailNotifications: Boolean,
      pushNotifications: Boolean,
      newReleases: Boolean,
      friendActivity: Boolean
    }
  }
}
```

### 2. Song Model (`song.model.js`)

```javascript
{
  title: String (required),
  artist: String (required),
  albumIds: [ObjectId → Album],
  imageUrl: String (required),
  audioUrl: String (required),
  duration: String (required),
  timestamps: true
}
```

### 3. Album Model (`album.model.js`)

```javascript
{
  title: String (required),
  artist: String (required),
  imageUrl: String (required),
  songs: [ObjectId → Song],
  releaseYear: Number (required),
  timestamps: true
}
```

### 4. Message Model (`message.model.js`)

```javascript
{
  senderId: String (required),
  receiverId: String (required),
  content: String (required),
  timestamps: true
}
```

### 5. Todo Model (`todo.model.js`)

```javascript
{
  title: String (required, max: 200 chars),
  description: String (max: 1000 chars),
  completed: Boolean (default: false),
  priority: Enum['low', 'medium', 'high'] (default: 'medium'),
  category: Enum['general', 'music', 'backend', 'frontend', 'bug', 'feature'],
  createdBy: ObjectId → User (required),
  timestamps: true
}
// Indexes: (createdBy, completed), (priority)
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/callback` | No | Create/sync user from Clerk |

### User Routes (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get all users (except current) |
| GET | `/last-seen` | ✅ | Get last seen data for all users |
| GET | `/messages/:userId` | ✅ | Get messages with specific user |
| GET | `/me/likes` | ✅ | Get current user's liked songs |
| POST | `/me/likes/:songId` | ✅ | Like a song |
| DELETE | `/me/likes/:songId` | ✅ | Unlike a song |
| DELETE | `/me` | ✅ | Delete current user account |
| GET | `/me/settings` | ✅ | Get user settings |
| PUT | `/me/settings` | ✅ | Update user settings |
| PATCH | `/me/settings/playback` | ✅ | Update playback settings only |

### Song Routes (`/api/songs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get all songs (sorted by newest) |
| GET | `/featured` | No | Get 6 random featured songs |
| GET | `/made-for-you` | No | Get 4 random personalized songs |
| GET | `/trending` | No | Get 4 random trending songs |
| GET | `/search?q=` | No | Search songs by title/artist |
| GET | `/:id` | No | Get song by ID |

### Album Routes (`/api/album`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get all albums |
| GET | `/:id` | No | Get album by ID (with populated songs) |

### Admin Routes (`/api/admin`) - *Requires Admin*

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/check` | ✅ Admin | Verify admin status |
| POST | `/songs` | ✅ Admin | Create a new song |
| PUT | `/songs/:id` | ✅ Admin | Update a song |
| DELETE | `/songs/:id` | ✅ Admin | Delete a song |
| POST | `/albums` | ✅ Admin | Create a new album |
| PUT | `/albums/:id` | ✅ Admin | Update an album |
| DELETE | `/albums/:id` | ✅ Admin | Delete an album |
| POST | `/albums/:id/songs` | ✅ Admin | Assign songs to album |
| POST | `/notifications` | ✅ Admin | Send broadcast notification |
| POST | `/process-audio-for-lyrics` | ✅ Admin | Transcribe audio to lyrics |

### Statistics Routes (`/api/stats`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ Admin | Get platform statistics |

### Todo Routes (`/api/todos`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get todos (with pagination & filters) |
| POST | `/` | ✅ | Create a new todo |
| GET | `/stats` | ✅ | Get todo statistics |
| GET | `/:id` | ✅ | Get todo by ID |
| PUT | `/:id` | ✅ | Update a todo |
| DELETE | `/:id` | ✅ | Delete a todo |
| PATCH | `/:id/toggle` | ✅ | Toggle completion status |

---

## 🔐 Authentication & Authorization

### Clerk Integration

The backend uses `@clerk/express` middleware for authentication:

```javascript
app.use(clerkMiddleware())
```

### Middleware Functions

#### `protectRoute`
- Checks if `req.auth.userId` exists
- Returns `401 Unauthorized` if not authenticated

#### `requireAdmin`
- Fetches user from Clerk using `clerkClient.users.getUser()`
- Checks if user's email is in `ADMIN_EMAILS` environment variable
- Returns `403 Forbidden` if not an admin

---

## 📂 File Upload System

### Configuration

```javascript
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: tempDir,
    limits: { 
        fileSize: 50 * 1024 * 1024,  // 50 MB max
        files: 2                      // Max 2 files
    },
    safeFileNames: true,
    preserveExtension: true
}));
```

### Cloudinary Integration

- **Auto resource type detection**
- **Chunked uploads** (20MB chunks)
- **5-minute timeout**
- **Automatic quality optimization** for images
- **Temp file cleanup** after upload

### Validation Rules

| File Type | Allowed MIME Types | Max Size |
|-----------|-------------------|----------|
| Audio | `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg` | 50 MB |
| Image | `image/jpeg`, `image/png`, `image/jpg` | 10 MB |

---

## 🔄 Real-time Features (Socket.IO)

### Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user_connected` | `userId` | User comes online |
| `update_activity` | `{userId, activity}` | Update user activity |
| `send_message` | `{senderId, receiverId, content}` | Send a chat message |
| `disconnect` | - | User goes offline |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user_connected` | `userId` | Broadcast user online |
| `user_disconnected` | `userId` | Broadcast user offline |
| `users_online` | `[userId]` | List of online users |
| `activities` | `[[userId, activity]]` | All user activities |
| `activity_updated` | `{userId, activity}` | Single activity update |
| `receive_message` | `Message` | Incoming chat message |
| `message_sent` | `Message` | Confirmation of sent message |
| `last_seen_updated` | `[[clerkId, timestamp]]` | Last seen updates |
| `broadcast_notification` | `{id, title, message, ...}` | Admin broadcast |

### Last Seen Tracking

- Updates on message send
- Updates on disconnect
- Persisted to MongoDB

---

## 🎤 Audio Transcription System

### Primary Method: AssemblyAI

```javascript
const assemblyai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY
});
```

- Uploads audio file
- Polls for transcription completion (max 5 minutes)
- Formats transcript with proper line breaks

### Fallback Methods

1. **FFprobe Analysis** - Uses audio duration and patterns
2. **Basic Speech Detection** - Analyzes audio buffer patterns
3. **Heuristic Generation** - Creates placeholder lyrics

### Features

- Downloads audio from URL
- Creates temp files with cleanup
- Handles relative/absolute URLs
- Graceful error handling with fallbacks

---

## ⏰ Scheduled Tasks

### Temp File Cleanup

```javascript
cron.schedule("0 * * * *", () => {
    // Cleans temp directory every hour
});
```

---

## 🌐 CORS Configuration

### Allowed Origins (Production)

- `http://localhost:4000`
- `http://127.0.0.1:4000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://spotify-chat-jqzp.onrender.com`
- `https://drs-music-player.onrender.com`
- Dynamic via `LOCAL_IP`, `FRONTEND_URL`, `ALLOWED_ORIGINS` env vars

### Development Mode

All origins are allowed in non-production environments.

---

## 📊 Statistics Calculation

The `/api/stats` endpoint provides:

- **Total Songs** - `Song.countDocuments()`
- **Total Albums** - `Album.countDocuments()`
- **Total Users** - `User.countDocuments()`
- **Unique Artists** - Aggregation across songs and albums

---

## 🔧 Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port |
| `MONGODB_URI` | MongoDB connection string |
| `NODE_ENV` | Environment (development/production) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `LOCAL_IP` | Local IP for CORS |
| `FRONTEND_URL` | Frontend URL for CORS |
| `ALLOWED_ORIGINS` | Additional CORS origins |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key for transcription |

---

## 🌱 Database Seeding

### Available Commands

```bash
npm run seed:songs   # Seed songs only
npm run seed:albums  # Seed albums and songs
npm run seed         # Auto-seed from local MP3 files
```

### Auto-Seed Features

- Reads MP3 files from `../frontend/public/songs`
- Extracts duration using `music-metadata`
- Parses title/artist from filename
- Assigns random cover images
- Sets random featured/trending flags

---

## ⚠️ Error Handling

### Global Error Middleware

```javascript
app.use((err, req, res, next) => {
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'production' 
            ? "Internal Server Error" 
            : err.message
    });
});
```

### File Upload Error Handling

- `LIMIT_FILE_SIZE` → 400 (File too large)
- `LIMIT_FILE_COUNT` → 400 (Too many files)
- Invalid format → 400 (Invalid request)

---

## 🎯 Key Features Summary

1. **Music Streaming Backend** - Songs, albums, playlists
2. **User Management** - Profiles, settings, liked songs
3. **Real-time Chat** - WebSocket-based messaging
4. **User Presence** - Online status, activity tracking
5. **Admin Dashboard** - Content management, broadcasts
6. **Audio Processing** - Lyrics extraction from audio
7. **Cloud Storage** - Cloudinary integration
8. **Search** - Title/artist search functionality
9. **Todo System** - Task management for users
10. **Comprehensive Settings** - Playback, display, privacy, notifications

---

## 🛡️ Security Measures

- ✅ Clerk authentication integration
- ✅ Admin role verification via email whitelist
- ✅ CORS protection in production
- ✅ File type validation
- ✅ File size limits
- ✅ Input sanitization utilities
- ✅ Automatic temp file cleanup

---

## 📈 Performance Optimizations

- MongoDB indexes on frequently queried fields
- Aggregation pipelines for statistics
- Chunked file uploads
- Random sampling for featured/trending content
- Pagination support for todos

---

## 📜 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/index.js` | Start production server |
| `dev` | `nodemon src/index.js` | Start development server |
| `seed:songs` | `node src/seeds/songs.js` | Seed songs data |
| `seed:albums` | `node src/seeds/albums.js` | Seed albums data |
| `seed` | `node src/scripts/seedSongs.js` | Auto-seed from MP3 files |

---

## 📝 Controller Functions Summary

### Auth Controller
| Function | Description |
|----------|-------------|
| `authCallback` | Creates or syncs user from Clerk authentication |

### User Controller
| Function | Description |
|----------|-------------|
| `getAllUsers` | Fetches all users except current user |
| `getMessages` | Gets chat messages between two users |
| `getLikedSongs` | Retrieves user's liked songs |
| `likeSong` | Adds a song to user's liked songs |
| `unlikeSong` | Removes a song from liked songs |
| `deleteUser` | Deletes user account |
| `getLastSeenData` | Gets last seen timestamps for all users |
| `getSettings` | Retrieves user settings |
| `updateSettings` | Updates user settings (deep merge) |
| `updatePlaybackSettings` | Quick update for playback settings |

### Song Controller
| Function | Description |
|----------|-------------|
| `getAllSong` | Gets all songs sorted by creation date |
| `getFeaturedSong` | Gets 6 random songs for featured section |
| `getMadeForYouSong` | Gets 4 random personalized songs |
| `getTreandingSong` | Gets 4 random trending songs |
| `getSongById` | Fetches a single song by ID |
| `searchSongs` | Searches songs by title or artist |

### Album Controller
| Function | Description |
|----------|-------------|
| `getAllAlbum` | Fetches all albums |
| `getAlbumById` | Gets album with populated songs |

### Admin Controller
| Function | Description |
|----------|-------------|
| `createSong` | Creates new song with file uploads |
| `deleteSong` | Deletes song and updates albums |
| `updateSong` | Updates song metadata and files |
| `createAlbum` | Creates new album with cover image |
| `deleteAlbum` | Deletes album and updates song references |
| `updateAlbum` | Updates album metadata and cover |
| `assignSongsToAlbum` | Manages album-song relationships |
| `sendBroadcastNotification` | Sends notification to all users |
| `checkAdmin` | Verifies admin status |
| `processAudioForLyrics` | Transcribes audio to text |

### Stats Controller
| Function | Description |
|----------|-------------|
| `getStats` | Aggregates platform statistics |

### Todo Controller
| Function | Description |
|----------|-------------|
| `getTodos` | Gets paginated todos with filters |
| `getTodoById` | Fetches single todo |
| `createTodo` | Creates new todo |
| `updateTodo` | Updates todo properties |
| `deleteTodo` | Deletes a todo |
| `toggleTodoComplete` | Toggles completion status |
| `getTodoStats` | Gets todo statistics and breakdown |

---

## 🔗 Model Relationships

```
┌─────────────┐       ┌─────────────┐
│    User     │       │    Song     │
├─────────────┤       ├─────────────┤
│ likedSongs ─┼──────▶│             │
│             │       │ albumIds ───┼──┐
└─────────────┘       └─────────────┘  │
      │                                 │
      │               ┌─────────────┐   │
      │               │   Album     │   │
      │               ├─────────────┤   │
      │               │ songs ◀─────┼───┘
      │               └─────────────┘
      │
      │               ┌─────────────┐
      │               │   Message   │
      │               ├─────────────┤
      └───────────────│ senderId    │
                      │ receiverId  │
                      └─────────────┘
      
      │               ┌─────────────┐
      │               │    Todo     │
      │               ├─────────────┤
      └───────────────│ createdBy ◀─┼───┘
                      └─────────────┘
```

---

## 📋 Conclusion

This is a comprehensive, production-ready music streaming backend with:

- **Robust Authentication** via Clerk
- **Real-time Features** via Socket.IO
- **Cloud Storage** via Cloudinary
- **Audio Processing** via AssemblyAI
- **Well-structured API** with proper error handling
- **Admin Controls** for content management
- **Comprehensive User Settings** for personalization

The codebase follows good practices with separation of concerns between routes, controllers, and models, making it maintainable and scalable.

---

*Report generated automatically by analyzing the complete backend codebase.*
