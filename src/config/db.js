const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/batdongsan_project';
    
    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] Connected to database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[MongoDB] Connection disconnected.`);
    });

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    // Do not crash the entire process immediately so db-status page can display the error status
    return null;
  }
};

module.exports = connectDB;

