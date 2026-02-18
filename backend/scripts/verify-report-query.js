const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const hostelId = new ObjectId("69948334358fa3339292aa59");

        const boarderCount = await db.collection('boarders').countDocuments({
            hostel_id: hostelId,
            isDeleted: false
        });
        console.log(`Matching Boarders for hostel ${hostelId}: ${boarderCount}`);

        const boarders = await db.collection('boarders').find({
            hostel_id: hostelId,
            isDeleted: false
        }).toArray();
        console.log('Boarder statuses:', boarders.map(b => b.status));

    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await client.close();
    }
}

check();
