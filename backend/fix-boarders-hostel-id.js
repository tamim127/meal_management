const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function fixData() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        // Target hostel ID found in previous research
        const targetHostelId = new ObjectId("69948334358fa3339292aa59");

        console.log(`Fixing boarders to associate them with hostel ${targetHostelId}...`);

        // Update all boarders who have hostel_id as null
        const result = await db.collection('boarders').updateMany(
            { hostel_id: null },
            { $set: { hostel_id: targetHostelId } }
        );

        console.log(`Successfully updated ${result.modifiedCount} boarders.`);

        // Also update boarders to link to their corresponding USERS by email
        const boarders = await db.collection('boarders').find({ user_id: null }).toArray();
        let linkCount = 0;
        for (const boarder of boarders) {
            if (boarder.email) {
                const user = await db.collection('users').findOne({ email: boarder.email });
                if (user) {
                    await db.collection('boarders').updateOne(
                        { _id: boarder._id },
                        { $set: { user_id: user._id } }
                    );
                    linkCount++;
                }
            }
        }
        console.log(`Successfully linked ${linkCount} boarders to their user accounts.`);

    } catch (err) {
        console.error('Data fix failed:', err.message);
    } finally {
        await client.close();
    }
}

fixData();
