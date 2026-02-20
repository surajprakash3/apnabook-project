const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

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

  const adminEmail = (process.env.ADMIN_EMAIL).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = await database.collection('users').findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await database.collection('users').insertOne({
        fullName: 'Admin User',
        name: 'Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        status: 'Active',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Seeded admin user: ${adminEmail}`);
    }
  }

  await database.collection('products').createIndexes([
    { key: { category: 1 } },
    { key: { price: 1 } },
    { key: { rating: -1 } },
    { key: { totalSales: -1 } },
    { key: { createdAt: -1 } },
    { key: { seller: 1, createdAt: -1 } },
    { key: { title: 'text', creator: 'text' } }
  ]);

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
