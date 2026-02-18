const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkData() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const boarders = await db.collection('boarders').find({}).toArray();
        console.log(`Found ${boarders.length} boarders in the database.`);
        if (boarders.length > 0) {
            console.log('Sample boarder:', JSON.stringify(boarders[0], null, 2));
        }

        const hostels = await db.collection('hostels').find({}).toArray();
        console.log(`Found ${hostels.length} hostels in the database.`);
    } catch (err) {
        console.error('Data check failed:', err.message);
    } finally {
        await client.close();
    }
}

checkData();
