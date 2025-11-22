import { clerkClient } from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();    

export const protectRoute = async (req, res, next) => {
    if(!req.auth.userId){
        return res.status(401).json({ message: "Unauthorized-Login to access" });
    }
    next();
}

export const requireAdmin = async (req, res, next) => {
    try {
        const currentUser = await clerkClient.users.getUser(req.auth.userId);
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(currentUser.primaryEmailAddress?.emailAddress);
        if (!isAdmin) {
            return res.status(403).json({ message: "Forbidden-You don't have access" });
        }
        next();
    } catch (error) {
        console.error("Error in checking admin",error);
        res.status(500).json({ message: "Internal server error" });
    }
}