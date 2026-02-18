const { connectDB, getDb } = require('./config/db');
require('dotenv').config();

async function makeAdmin(email) {
    if (!email) {
        console.log('Usage: node make-admin.js <email>');
        process.exit(1);
    }

    try {
        await connectDB();
        const db = getDb();

        const result = await db.collection('users').updateOne(
            { email: email.toLowerCase().trim() },
            {
                $set: {
                    role: 'admin',
                    isActive: true,
                    approvalStatus: 'approved',
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            console.log(`User with email ${email} not found.`);
        } else {
            console.log(`Successfully promoted ${email} to Admin and activated account.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

const emailArg = process.argv[2];
makeAdmin(emailArg);
