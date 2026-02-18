const mealController = require('./controllers/mealController');
const calculationController = require('./controllers/calculationController');
const { connectDB } = require('./config/db');
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function testControllers() {
    try {
        await connectDB();
        const hostelId = "69948334358fa3339292aa59";
        const mockUser = { _id: "69948e0780f49e00f47b4cbc", hostel_id: hostelId, role: 'admin' };

        const mockRes = {
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { this.body = data; return this; }
        };

        console.log('--- Testing getMealSummary ---');
        const reqMeal = { user: mockUser, query: { month: 2, year: 2026 } };
        const resMeal = { ...mockRes };
        await mealController.getMealSummary(reqMeal, resMeal);
        console.log('Status:', resMeal.statusCode);
        console.log('Body:', JSON.stringify(resMeal.body, null, 2));

        console.log('\n--- Testing getDueList ---');
        const reqDue = { user: mockUser, query: { month: 2, year: 2026 } };
        const resDue = { ...mockRes };
        await calculationController.getDueList(reqDue, resDue);
        console.log('Status:', resDue.statusCode);
        console.log('Body:', JSON.stringify(resDue.body, null, 2));

    } catch (err) {
        console.error('Test failed:', err.message);
        console.error(err.stack);
    } finally {
        process.exit(0);
    }
}

testControllers();
