const mongoose = require("mongoose");

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri, {
    appName: "st-cloud-superman",
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected");
};
