import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

export const authCallback = async (req, res) => {
    try {
        const { id, firstName, lastName, imageUrl } = req.body;

        // Check if user already exists
        const user = await User.findOne({ clerkId: id });
        if (!user) {
            // Create new user
            await User.create({
                clerkId: id,
                name: `${firstName || ""} ${lastName || ""}`.trim(),
                image: imageUrl
            });
        }
        res.status(200).json({ success: true, message: "User Created" });
    } catch (error) {
        console.log("Error in creating user", error);
        res.status(500).json({ success: false, message: "Error in creating user" });
    }
};

// Mobile auth - for development/testing only
// In production, you would use proper Clerk mobile SDK
export const mobileAuth = async (req, res) => {
    try {
        const { email, name, imageUrl } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Find or create user by email
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user with email as clerkId (for mobile)
            user = await User.create({
                clerkId: 'mobile_' + Date.now(),
                email: email,
                name: name || email.split('@')[0],
                image: imageUrl || ''
            });
        }

        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(email);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                clerkId: user.clerkId,
                email: user.email,
                name: user.name,
                imageUrl: user.image,
                isAdmin
            },
            // Simple token for mobile (in production use JWT)
            token: 'mobile_session_' + user._id
        });
    } catch (error) {
        console.log("Error in mobile auth", error);
        res.status(500).json({ success: false, message: "Error in mobile auth" });
    }
};