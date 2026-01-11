import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


export const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env file');
            return;
        }

        console.log('⏳ Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('❌ Error connecting to MongoDB:');
        console.error(error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.error('👉 Tip: Check if your local MongoDB server is running.');
        } else if (error.message.includes('querySrv ETIMEOUT')) {
            console.error('👉 Tip: Check your internet connection or Atlas cluster status.');
        } else if (error.message.includes('authentication failed')) {
            console.error('👉 Tip: Check your MongoDB username and password.');
        }

        // process.exit(1); // Optional: keep process running to see other errors
    }
}
