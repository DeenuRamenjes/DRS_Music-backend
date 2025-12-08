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
        // Check for mobile user first
        if (req.mobileUser) {
            const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
            const isAdmin = adminEmails.includes(req.mobileUser.email);
            if (!isAdmin) {
                return res.status(403).json({ message: "Forbidden-You don't have access" });
            }
            return next();
        }

        // Clerk auth
        const currentUser = await clerkClient.users.getUser(req.auth.userId);
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(currentUser.primaryEmailAddress?.emailAddress);
        if (!isAdmin) {
            return res.status(403).json({ message: "Forbidden-You don't have access" });
        }
        next();
    } catch (error) {
        console.error("Error in checking admin", error);
        res.status(500).json({ message: "Internal server error" });
    }
};