import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB',connect.connection.host);
    }
    catch (error) {
        console.log('Error connecting to MongoDB', error);
        process.exit(1); // Exit the process with failure
    }
}