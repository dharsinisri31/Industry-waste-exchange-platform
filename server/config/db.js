const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/waste_exchange";
  const fallbackUri = "mongodb://127.0.0.1:27017/waste_exchange";

  try {
    console.log("[DB] Attempting MongoDB primary connection...");
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (primaryError) {
    console.warn(`[DB] Primary MongoDB connection failed (${primaryError.message}). Trying fallback local URI...`);
    try {
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[DB] MongoDB Connected (Fallback): ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`[DB] Fallback MongoDB connection failed: ${fallbackError.message}`);
      return null;
    }
  }
};

module.exports = connectDB;