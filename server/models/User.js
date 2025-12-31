const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  diskiName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true }, // The real number
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["Admin", "Captain", "Player"],
    default: "Player",
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  areaId: { type: String, required: true },
  linkedPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" }, // Links to the actual stats
});

module.exports = mongoose.model("User", userSchema, "users");
