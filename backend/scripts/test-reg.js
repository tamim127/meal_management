const { connectDB, getDb } = require('./config/db');
const User = require('./models/User');
const Hostel = require('./models/Hostel');

async function test() {
    try {
        await connectDB();
        const db = getDb();
        console.log('Connected to DB');

        const testEmail = `test_${Date.now()}@example.com`;
        console.log(`Trying to register: ${testEmail}`);

        const user = await User.create({
            name: 'Test Admin',
            email: testEmail,
            password: 'password123',
            role: 'admin'
        });
        console.log('User created:', user._id);

        const hostel = await Hostel.create({
            name: 'Test Hostel',
            address: 'Test Address',
            created_by: user._id
        });
        console.log('Hostel created:', hostel._id);

        await User.update(user._id, { hostel_id: hostel._id });
        console.log('User updated with hostel_id');

        const token = User.generateAuthToken(user);
        console.log('Token generated');

        // Cleanup
        await db.collection('users').deleteOne({ _id: user._id });
        await db.collection('hostels').deleteOne({ _id: hostel._id });
        console.log('Cleanup done');

        console.log('TEST PASSED');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED');
        console.error(err);
        process.exit(1);
    }
}

test();
