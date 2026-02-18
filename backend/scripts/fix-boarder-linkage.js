const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function fixLinkage() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- Linking Boarders to Users ---');
        const boarders = await db.collection('boarders').find({}).toArray();
        const users = await db.collection('users').find({ role: 'boarder' }).toArray();

        let updatedCount = 0;

        for (const user of users) {
            // Find boarder with same email
            const boarder = boarders.find(b => b.email.toLowerCase() === user.email.toLowerCase());

            if (boarder) {
                if (!boarder.user_id || boarder.user_id.toString() !== user._id.toString()) {
                    await db.collection('boarders').updateOne(
                        { _id: boarder._id },
                        { $set: { user_id: user._id, status: 'active', updatedAt: new Date() } }
                    );

                    // Also ensure user is approved if boarder is active
                    if (user.approvalStatus !== 'approved') {
                        await db.collection('users').updateOne(
                            { _id: user._id },
                            { $set: { approvalStatus: 'approved', isActive: true, updatedAt: new Date() } }
                        );
                    }

                    console.log(`Linked Boarder ${boarder.fullName} to User ${user.email}`);
                    updatedCount++;
                }
            }
        }

        console.log(`\nLinkage fix complete. Updated ${updatedCount} boarders.`);

    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await client.close();
    }
}

fixLinkage();
