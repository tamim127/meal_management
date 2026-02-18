const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkLinkage() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- Users (Role: boarder) ---');
        const boarderUsers = await db.collection('users').find({ role: 'boarder' }).toArray();
        boarderUsers.forEach(u => console.log(`User: ${u.fullName}, Email: ${u.email}, ID: ${u._id}, approvalStatus: ${u.approvalStatus}`));

        console.log('\n--- Boarders ---');
        const boarders = await db.collection('boarders').find({}).toArray();
        boarders.forEach(b => console.log(`Boarder: ${b.fullName}, Email: ${b.email}, user_id: ${b.user_id}`));

        // Find boarders without user_id or where user_id doesn't match a user
        const orphans = boarders.filter(b => !b.user_id);
        console.log(`\nBoarders without user_id: ${orphans.length}`);

    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await client.close();
    }
}

checkLinkage();
