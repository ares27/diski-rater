const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const app = express();

require("dotenv").config();
app.use(express.json());

const allowedOrigins = [
  "https://diski-rater-app.synczen.co.za", // Keep this until propagation is finished
  "https://diski-rater.onrender.com", // Keep this until propagation is finished
  "http://localhost:5173", // Keep this for local development (if applicable)
].map((o) => o.replace(/\/$/, ""));

// CORS config
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
const Match = require("./models/Match");

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

// Create New Users with Auto-Promotion for Pioneers
app.post("/api/users", async (req, res) => {
  console.log("📥 Received registration request:", req.body.diskiName);
  try {
    const {
      firebaseUid,
      phoneNumber,
      diskiName,
      position,
      email,
      areaId,
      role,
      status,
    } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // 2. CHECK FOR PIONEER STATUS: Is this the first person in this area?
    // We check both the User and Player collections to be safe
    const userInArea = await User.findOne({ areaId });
    const playerInArea = await Player.findOne({
      $or: [{ area: areaId }, { areaId: areaId }],
    });

    const isFirstInArea = !userInArea && !playerInArea;

    // 3. Set Initial Status
    const finalStatus = isFirstInArea ? "Approved" : status || "Pending";
    let linkedPlayerId = null;

    // 4. IF FIRST USER: Automatically create their Player Card
    if (isFirstInArea) {
      const pioneerPlayer = new Player({
        name: diskiName,
        diskiName: diskiName,
        area: areaId,
        position: position,
        role: "Player", // They start as Player, then claim Captaincy via UI
        isPioneer: true,
        isSelected: false,
        ratings: {
          pace: 50,
          technical: 50,
          physical: 50,
          reliability: 50,
        },
      });
      const savedPlayer = await pioneerPlayer.save();
      linkedPlayerId = savedPlayer._id;
      console.info(
        `🌟 Pioneer detected! Auto-approved ${diskiName} for ${areaId}`
      );
    }

    // 5. Create the User record
    const newUser = new User({
      firebaseUid,
      phoneNumber,
      diskiName,
      position,
      email,
      areaId,
      role: role || "Player",
      status: finalStatus,
      linkedPlayerId: linkedPlayerId, // Link it immediately for pioneers
    });

    await newUser.save();

    // Return the user and a flag so the frontend can show a special welcome
    res.status(201).json({
      ...newUser.toObject(),
      isPioneer: isFirstInArea,
    });
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
        position: userToApprove.position,
        role: userToApprove.role,
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

// Upvote suggestions
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

// 1. Check if an area has an active captain
app.get("/api/areas/:areaId/has-captain", async (req, res) => {
  try {
    // Look for the Captain in the Player collection for this area
    const captainPlayer = await Player.findOne({
      $or: [{ area: req.params.areaId }, { areaId: req.params.areaId }],
      role: "Captain",
    }).lean();

    // 2. If no link on Player, check the User record just in case
    let link = captainPlayer?.socialLink;

    if (!link && captainPlayer) {
      const capUser = await User.findOne({
        firebaseUid: captainPlayer.firebaseUid,
      });
      link = capUser?.captainClaim?.socialLink;
    }

    res.json({
      hasCaptain: !!captainPlayer,
      socialLink: captainPlayer?.socialLink || null,
      captainName: captainPlayer?.diskiName || "The Captain",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Submit Captaincy Claim & Auto-Promote
app.post("/api/users/claim-captain", async (req, res) => {
  try {
    const { firebaseUid, socialLink, note } = req.body;

    // 1. Update the User (The private record)
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          role: "Captain",
          captainClaim: { socialLink, note, claimedAt: new Date() },
        },
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // 2. Update the Player (The public record)
    if (updatedUser.linkedPlayerId) {
      await Player.findByIdAndUpdate(updatedUser.linkedPlayerId, {
        $set: {
          role: "Captain",
          socialLink: socialLink, // Sync the link here!
        },
      });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Whatsapp link
app.post("/api/users/update-squad-link", async (req, res) => {
  try {
    const { firebaseUid, newSocialLink } = req.body;

    // 1. Update User Record
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: { "captainClaim.socialLink": newSocialLink } },
      { new: true }
    );

    // 2. Sync to Player Record
    if (user && user.linkedPlayerId) {
      await Player.findByIdAndUpdate(user.linkedPlayerId, {
        $set: { socialLink: newSocialLink },
      });
    }

    res.json({ success: true, newSocialLink });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a Match
app.post("/api/matches", async (req, res) => {
  try {
    // 1. Destructure all fields being sent from LogMatch.tsx
    const {
      areaId,
      submittedBy,
      score,
      lineups,
      playerPerformance, // This matches the frontend key
      expectedConfirmations,
    } = req.body;

    // Check if submitter is at least an approved user
    const user = await User.findOne({ firebaseUid: submittedBy });
    if (!user || user.status !== "Approved") {
      return res
        .status(403)
        .json({ message: "Only approved players can log matches." });
    }

    // 2. Add the missing fields to the new Match instance
    const newMatch = new Match({
      areaId,
      submittedBy,
      score,
      lineups,
      playerPerformance, // Ensure this matches your Schema name
      expectedConfirmations, // This was the missing link causing the error
      verifications: [submittedBy], // Submitter auto-verifies
      status: "Pending", // Explicitly set starting status
    });

    await newMatch.save();
    res.status(201).json(newMatch);
  } catch (err) {
    // 3. Log the error specifically for debugging
    console.error("Match Save Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Verify a Match
app.patch("/api/matches/:matchId/verify", async (req, res) => {
  try {
    const { firebaseUid } = req.body;
    const match = await Match.findById(req.params.matchId);

    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "Pending")
      return res.status(400).json({ message: "Match already locked" });

    // Add verification if not already present
    if (!match.verifications.includes(firebaseUid)) {
      match.verifications.push(firebaseUid);
    }

    // Calculate threshold
    const required = Math.ceil(match.expectedConfirmations * 0.75);

    if (match.verifications.length >= required) {
      match.status = "Verified";
      await match.save();

      // 🔥 CALL THE SERVER-SIDE FINALIZER
      await finalizeMatchStats(match);

      return res.json({ message: "Match verified and stats updated!", match });
    }

    await match.save();
    res.json({
      message: "Confirmation recorded",
      current: match.verifications.length,
      required,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join a Pending Match (for players left out of the initial lineup)
app.patch("/api/matches/:matchId/join", async (req, res) => {
  const { firebaseUid, team } = req.body;

  try {
    const match = await Match.findById(req.params.matchId);
    const player = await Player.findOne({ firebaseUid });

    if (!match) return res.status(404).json({ message: "Match not found" });
    if (!player)
      return res.status(404).json({ message: "Player profile not found" });

    if (match.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "This match is already verified and locked." });
    }

    const isAlreadyInA = match.lineups.teamA.some(
      (id) => id.toString() === player._id.toString()
    );
    const isAlreadyInB = match.lineups.teamB.some(
      (id) => id.toString() === player._id.toString()
    );

    if (isAlreadyInA || isAlreadyInB) {
      return res
        .status(400)
        .json({ message: "You are already in the lineup." });
    }

    // 1. Add to the chosen lineup
    if (team === "teamA") {
      match.lineups.teamA.push(player._id);
    } else if (team === "teamB") {
      match.lineups.teamB.push(player._id);
    } else {
      return res.status(400).json({ message: "Invalid team selection." });
    }

    // 2. Initialize performance entry
    match.playerPerformance.push({
      playerId: player._id,
      goals: 0,
      assists: 0,
      isMVP: false,
    });

    // 3. Update the math & verifications
    match.expectedConfirmations += 1;
    if (!match.verifications.includes(firebaseUid)) {
      match.verifications.push(firebaseUid);
    }

    // 4. NEW: CHECK FOR CONSENSUS
    const confirmedCount = match.verifications.length;
    const requiredCount = Math.ceil(match.expectedConfirmations * 0.75);

    if (confirmedCount >= requiredCount) {
      match.status = "Verified";

      // 5. UPDATE ALL PLAYER STATS
      // We loop through everyone in the match and update their career totals
      const updatePromises = match.playerPerformance.map(async (perf) => {
        const isTeamA = match.lineups.teamA.includes(perf.playerId);

        let result = "draw";
        if (match.score.teamA > match.score.teamB) {
          result = isTeamA ? "win" : "loss";
        } else if (match.score.teamB > match.score.teamA) {
          result = isTeamA ? "loss" : "win";
        }

        return Player.findByIdAndUpdate(perf.playerId, {
          $inc: {
            "careerStats.matchesPlayed": 1,
            "careerStats.goals": perf.goals,
            "careerStats.assists": perf.assists,
            "careerStats.wins": result === "win" ? 1 : 0,
            "careerStats.losses": result === "loss" ? 1 : 0,
            "careerStats.draws": result === "draw" ? 1 : 0,
          },
        });
      });

      await Promise.all(updatePromises);
      console.log(
        `Match ${match._id} has been verified via Join! Stats updated.`
      );
    }

    await match.save();

    res.json({
      message: `Successfully joined Team ${team === "teamA" ? "A" : "B"}. ${
        match.status === "Verified" ? "Match is now Verified!" : ""
      }`,
      match,
    });
  } catch (err) {
    console.error("Join Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all pending matches for an area
app.get("/api/matches/pending/:areaId", async (req, res) => {
  try {
    const { areaId } = req.params;
    console.log("Searching for pending matches in area:", areaId);
    const matches = await Match.find({
      areaId: req.params.areaId,
      status: "Pending",
    }).sort({ createdAt: 1 }); // Changed from -1 to 1 for oldest first
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get data for Match Details
app.get("/api/matches/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("lineups.teamA", "diskiName position") // Get names/positions for lineup
      .populate("lineups.teamB", "diskiName position")
      .populate("playerPerformance.playerId", "diskiName"); // Get names for stats

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  } catch (err) {
    console.error("Fetch Match Error:", err);
    res.status(500).json({ message: "Server error fetching match details" });
  }
});

// Change the path to include /api/matches
// GET /api/matches/area/:areaName
app.get("/api/matches/area/:areaName", async (req, res) => {
  try {
    const { areaName } = req.params;

    const matches = await Match.find({
      areaId: { $regex: new RegExp(`^${areaName}$`, "i") },
    })
      .sort({ createdAt: -1 })
      // Use dot notation for nested fields
      .populate("lineups.teamA")
      .populate("lineups.teamB");

    res.json(matches || []);
  } catch (error) {
    console.error("Area Fetch Error:", error);
    res.status(500).json({ message: "Error fetching area matches" });
  }
});

// ****************************************************
// Helper Functions
// Add this helper function to your index.js (or a utils file)
async function finalizeMatchStats(match) {
  const Player = require("./models/Player");

  // 1. Fetch current ratings for all players in this match to check the 75-threshold and 99-cap
  const playerIds = match.playerPerformance.map((p) => p.playerId);
  const players = await Player.find({ _id: { $in: playerIds } });

  // Create a quick lookup map for player data
  const playerMap = {};
  players.forEach((p) => {
    playerMap[p._id.toString()] = p;
  });

  const isDraw = match.score.teamA === match.score.teamB;
  const teamAWins = match.score.teamA > match.score.teamB;
  const teamBWins = match.score.teamB > match.score.teamA;

  // 2. Map performance to bulk operations
  const operations = match.playerPerformance
    .map((perf) => {
      const currentPlayer = playerMap[perf.playerId.toString()];
      if (!currentPlayer) return null;

      const isTeamA = match.lineups.teamA.some(
        (id) => id.toString() === perf.playerId.toString()
      );

      // Determine Match Outcome
      let winInc = 0,
        lossInc = 0,
        drawInc = 0,
        skillBonus = 0;
      const matchResult = winInc ? "W" : drawInc ? "D" : "L";

      if (isDraw) {
        drawInc = 1;
        skillBonus = 0.2;
      } else if (isTeamA) {
        teamAWins
          ? ((winInc = 1), (skillBonus = 1.5))
          : ((lossInc = 1), (skillBonus = -0.5));
      } else {
        teamBWins
          ? ((winInc = 1), (skillBonus = 1.5))
          : ((lossInc = 1), (skillBonus = -0.5));
      }

      // Calculate Raw Deltas
      let tDelta = perf.goals * 1.5 + perf.assists * 1.0 + (perf.isMVP ? 2 : 0);
      let rDelta = skillBonus + (perf.isMVP ? 2 : 0);
      let pDelta = (skillBonus > 0 ? 0.5 : 0) + (perf.goals > 0 ? 0.3 : 0);
      let paceDelta = perf.goals > 1 ? 0.5 : 0.1;

      // --- APPLY DIMINISHING RETURNS (The "75 Rule") ---
      // If a rating is already 75 or higher, cut the gain by 50%
      if (currentPlayer.ratings.technical >= 75) tDelta *= 0.5;
      if (currentPlayer.ratings.reliability >= 75) rDelta *= 0.5;
      if (currentPlayer.ratings.physical >= 75) pDelta *= 0.5;
      if (currentPlayer.ratings.pace >= 75) paceDelta *= 0.5;

      // --- APPLY HARD CAP PROTECTION (The "99 Rule") ---
      // Ensure the increment doesn't push them over 99
      const capAt99 = (current, delta) => {
        if (current + delta > 99) return 99 - current;
        if (current + delta < 0) return -current; // Don't go below 0
        return delta;
      };

      return {
        updateOne: {
          filter: { _id: perf.playerId },
          update: {
            $inc: {
              "careerStats.goals": perf.goals || 0,
              "careerStats.assists": perf.assists || 0,
              "careerStats.matchesPlayed": 1,
              "careerStats.mvps": perf.isMVP ? 1 : 0,
              "careerStats.wins": winInc,
              "careerStats.losses": lossInc,
              "careerStats.draws": drawInc,
              // Increments adjusted for the 99 cap
              "ratings.technical": capAt99(
                currentPlayer.ratings.technical,
                tDelta
              ),
              "ratings.reliability": capAt99(
                currentPlayer.ratings.reliability,
                rDelta
              ),
              "ratings.physical": capAt99(
                currentPlayer.ratings.physical,
                pDelta
              ),
              "ratings.pace": capAt99(currentPlayer.ratings.pace, paceDelta),
            },
            $set: {
              "lastChange.technical": tDelta,
              "lastChange.reliability": rDelta,
              "lastChange.physical": pDelta,
              "lastChange.pace": paceDelta,
            },
            $push: {
              form: {
                $each: [matchResult],
                $slice: -5, // Keeps only the last 5 entries
              },
            },
          },
        },
      };
    })
    .filter((op) => op !== null);

  if (operations.length > 0) {
    await Player.bulkWrite(operations);
    console.log(
      `✅ Stats & Ratings (with diminishing returns) updated for ${operations.length} players.`
    );
  }
}

// ****************************************************
// Server Start
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
