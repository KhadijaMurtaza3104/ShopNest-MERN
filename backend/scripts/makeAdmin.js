require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const makeAdmin = async () => {
  try {
    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
      console.error("Please provide a user email.");
      process.exitCode = 1;
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found. Register this email first.");
      process.exitCode = 1;
      return;
    }

    if (user.role === "admin") {
      console.log("This user is already an admin.");
      return;
    }

    user.role = "admin";
    await user.save();

    console.log("Admin role assigned successfully.");
    console.log("Admin email:", user.email);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

makeAdmin();