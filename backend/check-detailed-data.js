const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkData() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const hostels = await db.collection('hostels').find({}).toArray();
        console.log('Hostels:', JSON.stringify(hostels, null, 2));

        const users = await db.collection('users').find({}).toArray();
        console.log('Users (masked):', JSON.stringify(users.map(u => ({ ...u, password: '***' })), null, 2));

        const boarders = await db.collection('boarders').find({}).toArray();
        console.log('Boarders (1st 2):', JSON.stringify(boarders.slice(0, 2), null, 2));

    } catch (err) {
        console.error('Data check failed:', err.message);
    } finally {
        await client.close();
    }
}

checkData();
