import { Server } from 'socket.io';
import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';

let ioInstance;

const updateAndEmitLastSeen = async (userId, createIfMissing = false) => {
    try {
        let query = { clerkId: userId };
        if (!createIfMissing) {
            query.lastSeen = { $exists: true };
        }

        const existingUser = await User.findOne(query);

        if (existingUser || createIfMissing) {
            await User.findOneAndUpdate(
                { clerkId: userId },
                { $set: { lastSeen: new Date() } },
                { new: true, select: 'clerkId lastSeen', upsert: createIfMissing }
            );

            const updatedUser = await User.findOne({ clerkId: userId }, 'clerkId lastSeen');
            if (updatedUser && updatedUser.lastSeen) {
                ioInstance.emit("last_seen_updated", [[updatedUser.clerkId, updatedUser.lastSeen.getTime()]]);
            }
        }
    } catch (error) {
        console.error("Error updating lastSeen:", error);
    }
};

export const initializeSocket = (server) => {
    let allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:4000',
        'https://drs-music-player.onrender.com'
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

    ioInstance = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true
        }
    })
    const userSockets = new Map();
    const userActivities = new Map();

    ioInstance.on('connection', (socket) => {
        socket.on("user_connected", async (userId) => {
            userSockets.set(userId, socket.id);
            userActivities.set(userId, "Idle");

            ioInstance.emit("user_connected", userId);
            socket.emit("users_online", Array.from(userSockets.keys()));
            ioInstance.emit("activities", Array.from(userActivities.entries()));

            try {
                const users = await User.find({}, 'clerkId lastSeen');
                const lastSeenData = users
                    .filter(user => user.lastSeen && !isNaN(user.lastSeen.getTime()))
                    .map(user => [user.clerkId, user.lastSeen.getTime()]);
                socket.emit("last_seen_updated", lastSeenData);
            } catch (error) {
                console.error("Error fetching lastSeen data:", error);
            }
        })

        socket.on("update_activity", async ({ userId, activity }) => {
            userActivities.set(userId, activity);

            ioInstance.emit("activity_updated", { userId, activity });
        })

        socket.on("send_message", async (data) => {
            try {
                const { senderId, receiverId, content, messageType, songData } = data

                const messageData = {
                    senderId,
                    receiverId,
                    content
                };

                // Add song data if it's a song message
                if (messageType === 'song' && songData) {
                    messageData.messageType = 'song';
                    messageData.songData = {
                        songId: songData.songId,
                        title: songData.title,
                        artist: songData.artist,
                        imageUrl: songData.imageUrl,
                        audioUrl: songData.audioUrl,
                        duration: songData.duration
                    };
                }

                const message = await Message.create(messageData)

                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    ioInstance.to(receiverSocketId).emit("receive_message", message);
                }
                socket.emit("message_sent", message);

                // Update lastSeen for both sender and receiverawait updateAndEmitLastSeen(senderId);

            } catch (error) {
                console.error("Message_error", error);
                socket.emit("message_error", error.message);
            }
        })

        socket.on("disconnect", async () => {
            let dissconnectUserId;
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    dissconnectUserId = userId;
                    userSockets.delete(userId);
                    userActivities.delete(userId);

                    await updateAndEmitLastSeen(userId, true);
                    break;
                }
            }
            if (dissconnectUserId) {
                ioInstance.emit("user_disconnected", dissconnectUserId);
            }
        })
    })
}

export const getIO = () => ioInstance;