
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn.connection;
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
