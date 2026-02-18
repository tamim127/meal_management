const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

console.log('Using MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED');

const client = new MongoClient(process.env.MONGODB_URI);

let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db();
    console.log(`MongoDB Connected to database: ${db.databaseName}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Let the caller handle it or at least log it without crashing immediately
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
}

module.exports = { connectDB, getDb, toObjectId };
