/**
 * Script to migrate from clerkId to googleId index
 * Run this once to fix the duplicate key error
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateIndexes = async () => {
    console.log('🔧 Migrating database indexes from clerkId to googleId...\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get current indexes
        const indexes = await usersCollection.indexes();
        console.log('📋 Current indexes:');
        indexes.forEach(idx => console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`));
        console.log('');

        // Drop clerkId index if it exists
        const clerkIdIndex = indexes.find(idx => idx.key && idx.key.clerkId);
        if (clerkIdIndex) {
            console.log('🗑️  Dropping old clerkId index...');
            await usersCollection.dropIndex('clerkId_1');
            console.log('✅ Dropped clerkId_1 index');
        } else {
            console.log('ℹ️  No clerkId index found');
        }

        // Check if googleId index exists, if not create it
        const googleIdIndex = indexes.find(idx => idx.key && idx.key.googleId);
        if (!googleIdIndex) {
            console.log('➕ Creating googleId index...');
            await usersCollection.createIndex({ googleId: 1 }, { unique: true });
            console.log('✅ Created googleId index');
        } else {
            console.log('ℹ️  googleId index already exists');
        }

        // Rename clerkId to googleId in all documents
        console.log('\n🔄 Renaming clerkId field to googleId in all documents...');
        const result = await usersCollection.updateMany(
            { clerkId: { $exists: true } },
            { $rename: { clerkId: 'googleId' } }
        );
        console.log(`✅ Updated ${result.modifiedCount} documents`);

        // Show final indexes
        const finalIndexes = await usersCollection.indexes();
        console.log('\n📋 Final indexes:');
        finalIndexes.forEach(idx => console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`));

        console.log('\n✅ Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

migrateIndexes();
