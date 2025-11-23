import {Server} from 'socket.io';
import {Message} from '../models/message.model.js';

let ioInstance;

export const initializeSocket = (server) => {
    ioInstance = new Server(server, {
        cors:{
            origin: [
                'http://localhost:4000',
                'http://localhost:5173',
                'https://drs-music-xp1f.onrender.com'
            ],
            credentials: true
        }
    })
    const userSockets = new Map();
    const userActivities = new Map();

    ioInstance.on('connection', (socket) => {
        socket.on("user_connected", (userId) => {
            userSockets.set(userId, socket.id);
            userActivities.set(userId, "Idle");

            ioInstance.emit("user_connected", userId);

            socket.emit("users_online",Array.from(userSockets.keys()));

            ioInstance.emit("activities",Array.from(userActivities.entries()));
            
        })
        socket.on("update_activity", ({userId, activity}) => {
            userActivities.set(userId, activity);
            ioInstance.emit("activity_updated",{userId, activity});
        })

        socket.on("send_message", async (data) => {
            try {
                const {senderId,receiverId,content}=data

                const message=await Message.create({
                    senderId,
                    receiverId,
                    content
                })

                const receiverSocketId=userSockets.get(receiverId);
                if(receiverSocketId){
                    ioInstance.to(receiverSocketId).emit("receive_message", message);
                }
                // notify sender with the persisted message so the UI can sync ids/state
                socket.emit("message_sent", message);

            } catch (error) {
                console.error("Message_error",error);
                socket.emit("message_error", error.message);
            }
        })

        socket.on("disconnect", () => {
            let dissconnectUserId;
            for(const[userId, socketId] of userSockets.entries()){
                if(socketId===socket.id){
                    dissconnectUserId=userId;
                    userSockets.delete(userId);
                    userActivities.delete(userId);
                    break;
                }
            }
            if(dissconnectUserId){
                ioInstance.emit("user_disconnected", dissconnectUserId);
            }
        })
    })
}

export const getIO = () => ioInstance;