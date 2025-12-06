import { User } from '../models/user.model.js'
import { Message } from '../models/message.model.js'
import { Song } from '../models/song.model.js'


export const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.auth.userId
    const users = await User.find({ clerkId: { $ne: currentUserId } })
    res.status(200).json(users)
  }
  catch (err) {
    console.error("Error in getAllUsers", err.message);
    next(err)
  }
}

export const getMessages = async (req, res, next) => {
  try {
    const myId = req.auth.userId

    const { userId } = req.params

    const messages = await Message.find({
      $or: [{
        senderId: userId,
        receiverId: myId
      }, {
        senderId: myId,
        receiverId: userId
      }
      ]
    }).sort({ createdAt: 1 })
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

export const deleteUser = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user from MongoDB
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser', error);
    next(error);
  }
};

export const getLastSeenData = async (req, res, next) => {
  try {
    const users = await User.find({}, 'clerkId lastSeen');
    const lastSeenData = users
      .filter(user => user.lastSeen && !isNaN(user.lastSeen.getTime()))
      .map(user => [user.clerkId, user.lastSeen.getTime()]);

    res.status(200).json(lastSeenData);
  } catch (error) {
    console.error('Error in getLastSeenData', error);
    next(error);
  }
};

// Get user settings
export const getSettings = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return settings with defaults if not set
    const settings = user.settings || {
      playback: {
        shuffle: false,
        loop: false,
        volume: 0.7,
        audioQuality: 'high',
        crossfade: false,
        gaplessPlayback: true,
        normalizeVolume: false
      },
      display: {
        theme: 'dark',
        accentColor: 'emerald',
        compactMode: false,
        layout: 'default'
      },
      downloads: {
        downloadQuality: 'high',
        downloadOverWifi: true,
        autoDownload: false
      },
      privacy: {
        profileVisibility: 'public',
        showListeningActivity: true,
        allowFriendRequests: true
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        newReleases: true,
        friendActivity: true
      }
    };

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error in getSettings', error);
    next(error);
  }
};

// Update user settings
export const updateSettings = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deep merge settings
    if (settings.playback) {
      user.settings = user.settings || {};
      user.settings.playback = { ...user.settings.playback, ...settings.playback };
    }
    if (settings.display) {
      user.settings = user.settings || {};
      user.settings.display = { ...user.settings.display, ...settings.display };
    }
    if (settings.downloads) {
      user.settings = user.settings || {};
      user.settings.downloads = { ...user.settings.downloads, ...settings.downloads };
    }
    if (settings.privacy) {
      user.settings = user.settings || {};
      user.settings.privacy = { ...user.settings.privacy, ...settings.privacy };
    }
    if (settings.notifications) {
      user.settings = user.settings || {};
      user.settings.notifications = { ...user.settings.notifications, ...settings.notifications };
    }

    await user.save();

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Error in updateSettings', error);
    next(error);
  }
};

// Update specific playback settings (for quick updates like shuffle/loop)
export const updatePlaybackSettings = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { shuffle, loop, volume } = req.body;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize settings if not exists
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.playback) {
      user.settings.playback = {};
    }

    // Update only provided values
    if (typeof shuffle === 'boolean') {
      user.settings.playback.shuffle = shuffle;
    }
    if (typeof loop === 'boolean') {
      user.settings.playback.loop = loop;
    }
    if (typeof volume === 'number') {
      user.settings.playback.volume = Math.max(0, Math.min(1, volume));
    }

    await user.save();

    res.status(200).json({
      message: 'Playback settings updated',
      playback: user.settings.playback
    });
  } catch (error) {
    console.error('Error in updatePlaybackSettings', error);
    next(error);
  }
};
