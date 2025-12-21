import { clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

// Helper to extract mobile user from token
const getMobileUser = async (token) => {
    if (!token || !token.startsWith('mobile_session_')) {
        return null;
    }
    const userId = token.replace('mobile_session_', '');
    try {
        const user = await User.findById(userId);
        return user;
    } catch (e) {
        return null;
    }
};

export const protectRoute = async (req, res, next) => {
    // Check for mobile token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer mobile_session_')) {
        const token = authHeader.replace('Bearer ', '');
        const mobileUser = await getMobileUser(token);
        if (mobileUser) {
            req.mobileUser = mobileUser;
            req.auth = { userId: mobileUser._id.toString() };
            return next();
        }
    }

    // Fall back to Clerk auth
    if (!req.auth?.userId) {
        return res.status(401).json({ message: "Unauthorized-Login to access" });
    }
    next();
};

export const requireAdmin = async (req, res, next) => {
    try {
        let userEmail = null;
        let dbUser = null;

        if (req.mobileUser) {
            dbUser = req.mobileUser;
            userEmail = req.mobileUser.email;
        } else if (req.auth?.userId) {
            const currentUser = await clerkClient.users.getUser(req.auth.userId);
            userEmail = currentUser.primaryEmailAddress?.emailAddress;
            dbUser = await User.findOne({ clerkId: req.auth.userId });
        }

        if (!dbUser) {
            return res.status(403).json({ message: "Forbidden-User not found" });
        }

        if (dbUser.isAdmin) {
            return next();
        }

        return res.status(403).json({ message: "Forbidden-You don't have access" });
    } catch (error) {
        console.error("Error in checking admin", error);
        res.status(500).json({ message: "Internal server error" });
    }
};