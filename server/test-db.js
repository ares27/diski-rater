const mongoose = require("mongoose");
require("dotenv").config();
const Player = require("./models/Player"); // Ensure path is correct
const User = require("./models/User"); // Ensure path is correct

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info("✅ Database Connected!");

    // Create a dummy player
    const testPlayer = new Player({
      name: "Atlas Test Player",
      position: "MID",
      ratings: { pace: 99, technical: 99, physical: 99, reliability: 99 },
    });

    await testPlayer.save();
    console.info("🚀 Data successfully saved to Atlas!");

    const count = await Player.countDocuments();
    console.info(`📊 Total players in DB: ${count}`);

    process.exit();
  } catch (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
};

// testConnection();
