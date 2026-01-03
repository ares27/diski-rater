const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const app = express();

require("dotenv").config();
app.use(express.json());

const allowedOrigins = [
  "https://diski-rater.apps.synczen.co.za",
  "https://diski-rater-app.synczen.co.za", // Keep this until propagation is finished
  "https://diski-rater.onrender.com", // Keep this until propagation is finished
  // "http://localhost:3000", // Keep this for local development (if applicable)
  "http://localhost:5173", // Keep this for local development (if applicable)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  })
);

const Suggestion = require("./models/Suggestions");
const Player = require("./models/Player");
const User = require("./models/User");

// Connect to Atlas
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.info("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Could not connect", err));

// 1. GET all players from Atlas
app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    // console.log(players);
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST a new player to Atlas
app.post("/api/players", async (req, res) => {
  const player = new Player(req.body);
  try {
    const newPlayer = await player.save();
    res.status(201).json(newPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. PATCH (Update) a player (e.g., for ratings or selection)
app.patch("/api/players/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all suggestions
app.get("/api/suggestions", async (req, res) => {
  const suggestions = await Suggestion.find().sort({ createdAt: -1 });
  res.json(suggestions);
});

// Post a new suggestion
app.post("/api/suggestions", async (req, res) => {
  try {
    const newS = new Suggestion(req.body);
    await newS.save();
    res.status(201).json(newS);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create New Users
app.post("/api/users", async (req, res) => {
  console.log("📥 Received request body:", req.body); // Check if data arrives
  try {
    const { firebaseUid, phoneNumber, diskiName, email, areaId, role, status } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const newUser = new User({
      firebaseUid,
      phoneNumber,
      diskiName,
      email,
      areaId,
      role: role || "Player",
      status: status || "Pending",
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Mongo Save Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all users who are NOT yet approved
app.get("/api/users/pending", async (req, res) => {
  // console.log("📥 Received request body for pending users:", req.body); // Check if data arrives
  try {
    const pending = await User.find({ status: "Pending" });
    res.json(pending); // This must return an array []
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// server/index.js
app.get("/api/users/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve users to players
app.patch("/api/users/approve/:id", async (req, res) => {
  try {
    const { linkedPlayerId } = req.body;
    const userToApprove = await User.findById(req.params.id);

    if (!userToApprove)
      return res.status(404).json({ message: "User not found" });

    let finalPlayerId = linkedPlayerId;

    // IF NO PLAYER SELECTED: Create a new profile
    if (!finalPlayerId || finalPlayerId === "") {
      const newPlayer = new Player({
        name: userToApprove.diskiName,
        diskiName: userToApprove.diskiName,
        // FIX: Mapping the user's area field to the player's area field
        // We use || to handle cases where it might be stored as areaId or area
        area: userToApprove.area || userToApprove.areaId,
        position: "SUB",
        isSelected: false,
        ratings: {
          pace: 50,
          technical: 50,
          physical: 50,
          reliability: 50,
        },
      });

      const savedPlayer = await newPlayer.save();
      finalPlayerId = savedPlayer._id;
    }

    userToApprove.status = "Approved";
    userToApprove.linkedPlayerId = finalPlayerId;
    await userToApprove.save();

    res.json({
      message: "User approved and Player card created!",
      user: userToApprove,
    });
  } catch (err) {
    console.error("Mongo Save Error:", err);
    res.status(500).json({ message: err.message });
  }
});

app.patch("/api/suggestions/:id/upvote", async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } }, // This increments the number by 1
      { new: true }
    );
    res.json(suggestion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/api/test", (req, res) => {
  res.json({
    status: `⚽ DiskiRater server running on port ${PORT}`,
  });
});

app.get("/debug-db", (req, res) => {
  const connection = mongoose.connection;
  res.json({
    databaseName: connection.name, // The actual DB being used
    collections: Object.keys(connection.collections),
    host: connection.host,
    port: connection.port,
  });
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`⚽ DiskiRater server running on port ${PORT}`)
);
