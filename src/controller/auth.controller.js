import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

// Mobile auth - handles Google Sign-In users and demo/email users
export const mobileAuth = async (req, res) => {
    try {
        const { email, name, imageUrl, googleId } = req.body;

        if (!email && !googleId) {
            return res.status(400).json({ success: false, message: "Email or GoogleId is required" });
        }

        let user = null;

        // PRIORITY ORDER FOR FINDING EXISTING USERS:
        // 1. By googleId (if provided) - most specific
        // 2. By email (if provided) - fallback

        if (googleId) {
            // First, try to find by exact googleId
            user = await User.findOne({ googleId });
        }

        // If not found by googleId, try email
        if (!user && email) {
            user = await User.findOne({ email });

            // If found by email but has different googleId, update it
            if (user && googleId && user.googleId !== googleId) {
                // Only update if the existing googleId looks like a mobile temp ID
                if (user.googleId.startsWith('mobile_')) {
                    user.googleId = googleId;
                    await user.save();
                }
            }
        }

        // Create new user only if not found by googleId OR email
        if (!user) {
            const newGoogleId = googleId || 'mobile_' + Date.now();
            const newName = name || (email ? email.split('@')[0] : 'User');

            // Double-check no user with this email exists (race condition prevention)
            if (email) {
                const existingByEmail = await User.findOne({ email });
                if (existingByEmail) {
                    user = existingByEmail;
                }
            }

            if (!user) {
                user = await User.create({
                    googleId: newGoogleId,
                    email: email || '',
                    name: newName,
                    image: imageUrl || ''
                });
            }
        } else {
            // Update existing user info if provided
            let updated = false;
            if (name && user.name !== name && user.name === 'User') {
                user.name = name;
                updated = true;
            }
            if (imageUrl && user.image !== imageUrl) {
                user.image = imageUrl;
                updated = true;
            }
            if (email && !user.email) {
                user.email = email;
                updated = true;
            }
            if (updated) {
                await user.save();
            }
        }

        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(user.email);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                imageUrl: user.image,
                isAdmin
            },
            // Simple token for mobile (in production use JWT)
            token: 'mobile_session_' + user._id
        });
    } catch (error) {
        console.error("Error in mobile auth:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Request body:", req.body);
        res.status(500).json({
            success: false,
            message: "Error in mobile auth",
            error: error.message
        });
    }
};

// Email Login - For existing users, allows Google users to set password on first email login
export const emailLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "No account found with this email"
            });
        }

        const bcrypt = await import('bcryptjs');

        // Check if user has a password set
        if (!user.password) {
            // User exists (likely from Google sign-in) but has no password
            // Set the provided password as their new password
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();

            console.log(`Password set for existing user: ${user.email}`);
        } else {
            // User has password, verify it
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password"
                });
            }
        }

        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(user.email);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                imageUrl: user.image,
                isAdmin
            },
            token: 'mobile_session_' + user._id
        });
    } catch (error) {
        console.error("Error in email login:", error);
        res.status(500).json({ success: false, message: "Error in email login" });
    }
};

// Get current user - for session verification
export const getMe = async (req, res) => {
    try {
        // For mobile users, we have mobileUser set by auth middleware
        if (req.mobileUser) {
            const user = req.mobileUser;
            const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
            const isAdmin = adminEmails.includes(user.email);

            return res.status(200).json({
                _id: user._id,
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                imageUrl: user.image,
                createdAt: user.createdAt,
                isAdmin
            });
        }

        return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
        console.error("Error in getMe:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
