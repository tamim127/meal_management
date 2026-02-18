const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function fixReportData() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const hostelId = new ObjectId("69948334358fa3339292aa59");

        console.log('--- Fixing Boarders ---');
        // Set all boarders to active and ensured they have the hostel_id as ObjectId
        const boarderFix = await db.collection('boarders').updateMany(
            {},
            [
                {
                    $set: {
                        hostel_id: hostelId,
                        status: 'active',
                        isDeleted: false
                    }
                }
            ]
        );
        console.log(`Updated ${boarderFix.modifiedCount} boarders.`);

        const collections = ['meals', 'expenses', 'payments', 'calculations', 'monthly-closing'];

        for (const coll of collections) {
            console.log(`--- Fixing Collection: ${coll} ---`);
            const docs = await db.collection(coll).find({}).toArray();
            let updatedCount = 0;

            for (const doc of docs) {
                const updates = {};
                let needsUpdate = false;

                // Fix hostel_id
                if (doc.hostel_id && typeof doc.hostel_id === 'string') {
                    updates.hostel_id = new ObjectId(doc.hostel_id);
                    needsUpdate = true;
                } else if (!doc.hostel_id) {
                    updates.hostel_id = hostelId;
                    needsUpdate = true;
                }

                // Fix boarder_id
                if (doc.boarder_id && typeof doc.boarder_id === 'string') {
                    updates.boarder_id = new ObjectId(doc.boarder_id);
                    needsUpdate = true;
                }

                // Fix user_id / addedBy / created_by
                if (doc.user_id && typeof doc.user_id === 'string') {
                    updates.user_id = new ObjectId(doc.user_id);
                    needsUpdate = true;
                }
                if (doc.addedBy && typeof doc.addedBy === 'string') {
                    updates.addedBy = new ObjectId(doc.addedBy);
                    needsUpdate = true;
                }
                if (doc.created_by && typeof doc.created_by === 'string') {
                    updates.created_by = new ObjectId(doc.created_by);
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await db.collection(coll).updateOne({ _id: doc._id }, { $set: updates });
                    updatedCount++;
                }
            }
            console.log(`Updated ${updatedCount} documents in ${coll}.`);
        }

    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await client.close();
    }
}

fixReportData();
