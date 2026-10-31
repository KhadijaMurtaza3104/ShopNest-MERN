
const app = require("../app");
const connectDB = require("../config/db");

let dbConnectionPromise;

const connectDatabase = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  return dbConnectionPromise;
};

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API startup error:", error);

    return res.status(500).json({
      message: "Database connection failed",
    });
  }
};
