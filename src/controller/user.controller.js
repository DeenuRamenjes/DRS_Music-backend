import {User} from '../models/user.model.js'
import { Message } from '../models/message.model.js'
import { Song } from '../models/song.model.js'


export const getAllUsers = async(req, res,next) => {
  try{
    const currentUserId = req.auth.userId
    const users=await User.find({clerkId: {$ne: currentUserId}})
    res.status(200).json(users)
  }
  catch(err){
    console.error("Error in getAllUsers", err.message);
    next(err)
  }
}

export const getMessages= async(req, res,next) => {
  try {
    const myId=req.auth.userId

    const {userId}=req.params

    const messages=await Message.find({
      $or:[{
        senderId:userId,
        receiverId:myId
      },{
        senderId:myId,
        receiverId:userId
      }
    ]}).sort({createdAt: 1})
    res.status(200).json(messages)
  } catch (error) {
    console.error("Error in getMessages", error);
    next(error)
  }
}

const findUserByClerkId = async (clerkId) => {
  return User.findOne({ clerkId }).populate('likedSongs');
};

export const getLikedSongs = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const user = await findUserByClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.likedSongs || []);
  } catch (error) {
    console.error('Error in getLikedSongs', error);
    next(error);
  }
};

export const likeSong = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { songId } = req.params;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const alreadyLiked = user.likedSongs?.some((likedId) => likedId.toString() === songId);
    if (!alreadyLiked) {
      user.likedSongs.push(songId);
      await user.save();
    }

    await user.populate('likedSongs');
    res.status(200).json(user.likedSongs);
  } catch (error) {
    console.error('Error in likeSong', error);
    next(error);
  }
};

export const unlikeSong = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { songId } = req.params;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.likedSongs = user.likedSongs.filter((likedId) => likedId.toString() !== songId);
    await user.save();
    await user.populate('likedSongs');

    res.status(200).json(user.likedSongs);
  } catch (error) {
    console.error('Error in unlikeSong', error);
    next(error);
  }
};