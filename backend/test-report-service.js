const CalculationService = require('./services/calculationService');
const { connectDB, getDb } = require('./config/db');
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function testReport() {
    try {
        await connectDB();
        const hostelId = new ObjectId("69948334358fa3339292aa59");
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        console.log(`Generating report for ${month}/${year}...`);
        const result = await CalculationService.generateMonthlyStatements(hostelId, month, year);

        console.log('Report Results:');
        console.log(`Total Boarders: ${result.totalBoarders}`);
        console.log(`Total Meals: ${result.totalMeals}`);
        console.log(`Total Expense: ${result.totalExpense}`);
        console.log(`Meal Rate: ${result.mealRate}`);
        console.log(`Number of statements: ${result.statements.length}`);

        if (result.statements.length > 0) {
            console.log('Sample Statement:', JSON.stringify(result.statements[0], null, 2));
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        console.error(err.stack);
    } finally {
        process.exit(0);
    }
}

testReport();
