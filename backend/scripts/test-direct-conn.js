const { MongoClient } = require('mongodb');

const uri = "mongodb://hotel:4nB7Ram4SuCk0Yst@ac-t6fr4qa-shard-00-00.p1jaoj3.mongodb.net:27017,ac-t6fr4qa-shard-00-01.p1jaoj3.mongodb.net:27017,ac-t6fr4qa-shard-00-02.p1jaoj3.mongodb.net:27017/hostel_meal_management?ssl=true&replicaSet=atlas-szyvv9-shard-0&authSource=admin&retryWrites=true&w=majority";

const client = new MongoClient(uri, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
});

async function run() {
    try {
        console.log('Attempting to connect with direct URI...');
        await client.connect();
        console.log('Successfully connected to MongoDB Atlas!');
        const db = client.db();
        console.log(`Database name: ${db.databaseName}`);
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await client.close();
    }
}

run();
