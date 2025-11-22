import { User } from "../models/user.model.js";

export const authCallback = async(req, res) => {
    try {
        const { id, firstName, lastName, imageUrl } = req.body;

        // Check if user already exists
        const user = await User.findOne({ clerkId: id });
        if (!user) {
            // Create new user
            await User.create({
                clerkId: id,
                name: `${firstName || "" } ${lastName || "" }`.trim(),
                image: imageUrl
            });
        }
        res.status(200).json({ success: true, message: "User Created" });
    } catch(error) {
        console.log("Error in creating user", error);
        res.status(500).json({ success: false, message: "Error in creating user" });
    }
};