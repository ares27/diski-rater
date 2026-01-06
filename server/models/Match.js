const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    areaId: { type: String, required: true },
    submittedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Contested"],
      default: "Pending",
    },
    score: {
      teamA: { type: Number, default: 0 },
      teamB: { type: Number, default: 0 },
    },
    lineups: {
      teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
      teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    },
    // Captures who did what in THIS specific match
    playerPerformance: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
        goals: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        isMVP: { type: Boolean, default: false },
      },
    ],
    expectedConfirmations: { type: Number, required: true },
    verifications: [String], // Firebase UIDs of players who confirmed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
