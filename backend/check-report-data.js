const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkCollections() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        const meals = await db.collection('meals').find({}).limit(5).toArray();
        console.log('Meals (top 5):', JSON.stringify(meals, null, 2));

        const expenses = await db.collection('expenses').find({}).limit(5).toArray();
        console.log('Expenses (top 5):', JSON.stringify(expenses, null, 2));

        const payments = await db.collection('payments').find({}).limit(5).toArray();
        console.log('Payments (top 5):', JSON.stringify(payments, null, 2));

        const mealCount = await db.collection('meals').countDocuments();
        const mealWithHostelCount = await db.collection('meals').countDocuments({ hostel_id: { $ne: null } });
        console.log(`Meals: Total ${mealCount}, With Hostel ID: ${mealWithHostelCount}`);

        const expenseCount = await db.collection('expenses').countDocuments();
        const expenseWithHostelCount = await db.collection('expenses').countDocuments({ hostel_id: { $ne: null } });
        console.log(`Expenses: Total ${expenseCount}, With Hostel ID: ${expenseWithHostelCount}`);

        const paymentCount = await db.collection('payments').countDocuments();
        const paymentWithHostelCount = await db.collection('payments').countDocuments({ hostel_id: { $ne: null } });
        console.log(`Payments: Total ${paymentCount}, With Hostel ID: ${paymentWithHostelCount}`);

    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await client.close();
    }
}

checkCollections();
