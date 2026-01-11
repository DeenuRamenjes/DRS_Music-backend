/**
 * Database Cleanup Script
 * 
 * Fixes:
 * 1. Migrates remaining clerkId fields to googleId
 * 2. Removes duplicate users (keeps the most recent one)
 * 3. Removes duplicate songs (keeps the one with best metadata)
 * 4. Cleans up empty/null fields
 * 
 * Run: node scripts/cleanupDatabase.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// Connect to MongoDB
// ==========================================
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env file');
        }
        console.log('⏳ Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}\n`);
        return conn.connection.db;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// ==========================================
// Cleanup Functions
// ==========================================

/**
 * 1. Migrate clerkId to googleId for remaining users
 */
const migrateClerkToGoogle = async (db) => {
    console.log('\n🔄 Migrating clerkId to googleId...');

    const usersCollection = db.collection('users');

    // Find users with clerkId but no googleId
    const usersWithClerkId = await usersCollection.find({
        clerkId: { $exists: true, $ne: null },
        googleId: { $exists: false }
    }).toArray();

    if (usersWithClerkId.length === 0) {
        console.log('   ℹ️  No users need migration');
        return;
    }

    for (const user of usersWithClerkId) {
        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: { googleId: user.clerkId },
                $unset: { clerkId: '' }
            }
        );
        console.log(`   ✅ Migrated user: ${user.email || user._id}`);
    }

    console.log(`   ✅ Migrated ${usersWithClerkId.length} users`);
};

/**
 * 2. Remove users with both clerkId and googleId (keep googleId version)
 */
const cleanupDuplicateUsers = async (db) => {
    console.log('\n🔄 Checking for duplicate users...');

    const usersCollection = db.collection('users');

    // Find users who have both clerkId and googleId (duplicates from migration)
    const usersWithBoth = await usersCollection.find({
        clerkId: { $exists: true },
        googleId: { $exists: true }
    }).toArray();

    if (usersWithBoth.length > 0) {
        console.log(`   Found ${usersWithBoth.length} users with both clerkId and googleId`);
        for (const user of usersWithBoth) {
            // Remove the clerkId field (already has googleId)
            await usersCollection.updateOne(
                { _id: user._id },
                { $unset: { clerkId: '' } }
            );
            console.log(`   ✅ Removed clerkId from: ${user.email || user._id}`);
        }
    } else {
        console.log('   ℹ️  No duplicate users found');
    }

    // Find and remove completely duplicate users by email
    const pipeline = [
        { $match: { email: { $exists: true, $ne: '' } } },
        { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: { _id: '$_id', createdAt: '$createdAt' } } } },
        { $match: { count: { $gt: 1 } } }
    ];

    const duplicateEmails = await usersCollection.aggregate(pipeline).toArray();

    if (duplicateEmails.length > 0) {
        console.log(`   Found ${duplicateEmails.length} emails with duplicate users`);
        for (const dup of duplicateEmails) {
            // Keep the most recent, delete others
            const sortedDocs = dup.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const toDelete = sortedDocs.slice(1);

            for (const doc of toDelete) {
                await usersCollection.deleteOne({ _id: doc._id });
                console.log(`   🗑️  Deleted duplicate user for ${dup._id}`);
            }
        }
    }
};

/**
 * 3. Find and optionally remove duplicate songs
 */
const findDuplicateSongs = async (db) => {
    console.log('\n🔄 Finding duplicate songs...');

    const songsCollection = db.collection('songs');

    // Find songs with same title and artist (case insensitive)
    const pipeline = [
        {
            $group: {
                _id: {
                    title: { $toLower: '$title' },
                    artist: { $toLower: '$artist' }
                },
                count: { $sum: 1 },
                docs: {
                    $push: {
                        _id: '$_id',
                        title: '$title',
                        artist: '$artist',
                        duration: '$duration',
                        imageUrl: '$imageUrl',
                        createdAt: '$createdAt'
                    }
                }
            }
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } }
    ];

    const duplicates = await songsCollection.aggregate(pipeline).toArray();

    if (duplicates.length === 0) {
        console.log('   ℹ️  No duplicate songs found');
        return;
    }

    console.log(`   Found ${duplicates.length} groups of duplicate songs:\n`);

    let totalDuplicates = 0;
    for (const dup of duplicates) {
        console.log(`   📀 "${dup._id.title}" by "${dup._id.artist}" - ${dup.count} copies`);
        totalDuplicates += dup.count - 1;
    }

    console.log(`\n   Total duplicate songs that can be removed: ${totalDuplicates}`);
    console.log('   To remove duplicates, run: npm run cleanup:songs');
};

/**
 * 4. Remove duplicate songs (keep the best one)
 */
const removeDuplicateSongs = async (db) => {
    console.log('\n🗑️  Removing duplicate songs...');

    const songsCollection = db.collection('songs');

    const pipeline = [
        {
            $group: {
                _id: {
                    title: { $toLower: '$title' },
                    artist: { $toLower: '$artist' }
                },
                count: { $sum: 1 },
                docs: {
                    $push: {
                        _id: '$_id',
                        duration: '$duration',
                        imageUrl: '$imageUrl',
                        createdAt: '$createdAt'
                    }
                }
            }
        },
        { $match: { count: { $gt: 1 } } }
    ];

    const duplicates = await songsCollection.aggregate(pipeline).toArray();

    let removed = 0;
    for (const dup of duplicates) {
        // Sort to keep the best one:
        // - Prefer songs with non-placeholder images
        // - Prefer songs with proper duration
        // - Prefer most recent
        const sortedDocs = dup.docs.sort((a, b) => {
            // Prefer non-placeholder images
            const aHasImage = a.imageUrl && !a.imageUrl.includes('ui-avatars');
            const bHasImage = b.imageUrl && !b.imageUrl.includes('ui-avatars');
            if (aHasImage && !bHasImage) return -1;
            if (!aHasImage && bHasImage) return 1;

            // Prefer proper duration (not 0:00)
            const aHasDuration = a.duration && a.duration !== '0:00';
            const bHasDuration = b.duration && b.duration !== '0:00';
            if (aHasDuration && !bHasDuration) return -1;
            if (!aHasDuration && bHasDuration) return 1;

            // Keep most recent
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Delete all but the first (best) one
        const toDelete = sortedDocs.slice(1);
        for (const doc of toDelete) {
            await songsCollection.deleteOne({ _id: doc._id });
            removed++;
        }
    }

    console.log(`   ✅ Removed ${removed} duplicate songs`);
};

/**
 * 5. Fix empty required fields
 */
const fixEmptyFields = async (db) => {
    console.log('\n🔄 Fixing empty required fields...');

    const usersCollection = db.collection('users');

    // Fix users with empty name
    const result = await usersCollection.updateMany(
        { $or: [{ name: { $exists: false } }, { name: '' }, { name: null }] },
        { $set: { name: 'User' } }
    );

    if (result.modifiedCount > 0) {
        console.log(`   ✅ Fixed ${result.modifiedCount} users with empty names`);
    } else {
        console.log('   ℹ️  No users with empty names');
    }
};

// ==========================================
// Main Cleanup Function
// ==========================================
const runCleanup = async () => {
    console.log('\n🧹 Database Cleanup Script');
    console.log('═'.repeat(50) + '\n');

    const db = await connectDB();

    // Run cleanup steps
    await migrateClerkToGoogle(db);
    await cleanupDuplicateUsers(db);
    await findDuplicateSongs(db);
    await fixEmptyFields(db);

    // Check for command line args
    if (process.argv.includes('--remove-songs')) {
        await removeDuplicateSongs(db);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Cleanup complete!');
    console.log('═'.repeat(50) + '\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
};

// Run
runCleanup().catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
});
