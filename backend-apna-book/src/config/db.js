const { MongoClient } = require('mongodb');

let client;
let database;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  if (client && database) {
    return { client, db: database };
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(process.env.MONGO_DB_NAME || 'apnabook');
  console.log('MongoDB connected');
  return { client, db: database };
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

module.exports = { connectDB, getDb };
