const mongoose = require("mongoose");

module.exports = async function connectDB() {
  const uri = "mongodb+srv://aidan12031_db_user:oHBGjNpbCAThWQkm@cluster0.rpx3x54.mongodb.net/?appName=Cluster0";
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
