const { connectDB, getDb } = require('./config/db');
const User = require('./models/User');

async function verifyApproval() {
    try {
        await connectDB();
        const db = getDb();
        console.log('--- Verification Started ---');

        // 1. Test Admin (Hostel Creator) should be active
        const adminEmail = `admin_${Date.now()}@example.com`;
        const admin = await User.create({
            name: 'Main Admin',
            email: adminEmail,
            password: 'password123',
            role: 'admin',
            isActive: true
        });
        console.log(`Admin created: ${adminEmail}, isActive: ${admin.isActive}`);
        if (!admin.isActive) throw new Error('First Admin should be active!');

        // 2. Test Boarder should be inactive
        const boarderEmail = `boarder_${Date.now()}@example.com`;
        const boarder = await User.create({
            name: 'Test Boarder',
            email: boarderEmail,
            password: 'password123',
            role: 'boarder'
        });
        console.log(`Boarder created: ${boarderEmail}, isActive: ${boarder.isActive}`);
        if (boarder.isActive) throw new Error('Boarder should be inactive by default!');

        // 3. Test Approval
        await User.approve(boarder._id);
        const updatedBoarder = await User.findById(boarder._id);
        console.log(`Boarder after approval, isActive: ${updatedBoarder.isActive}`);
        if (!updatedBoarder.isActive) throw new Error('Boarder should be active after approval!');

        // 4. Test Update Sanitization (Persistence)
        await User.update(boarder._id, { _id: 'SHOULD_NOT_CHANGE', name: 'Updated Name' });
        const finalBoarder = await User.findById(boarder._id);
        console.log(`Boarder name after update: ${finalBoarder.name}`);
        if (finalBoarder.name !== 'Updated Name') throw new Error('Update persistence failed!');
        console.log('Update sanitization worked (no error thrown when passing _id)');

        // Cleanup
        await db.collection('users').deleteOne({ _id: admin._id });
        await db.collection('users').deleteOne({ _id: boarder._id });
        console.log('Cleanup successful');

        console.log('--- ALL VERIFICATIONS PASSED ---');
        process.exit(0);
    } catch (err) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

verifyApproval();
