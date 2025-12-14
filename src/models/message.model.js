import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
      {
            senderId: {
                  type: String,
                  required: true
            },
            receiverId: {
                  type: String,
                  required: true
            },
            content: {
                  type: String,
                  required: true
            },
            // Message type: 'text' (default) or 'song'
            messageType: {
                  type: String,
                  enum: ['text', 'song'],
                  default: 'text'
            },
            // Song data (only for song messages)
            songData: {
                  songId: { type: String },
                  title: { type: String },
                  artist: { type: String },
                  imageUrl: { type: String },
                  audioUrl: { type: String },
                  duration: { type: Number }
            }
      },
      { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);

