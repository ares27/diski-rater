const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  diskiName: { type: String, required: true },
  area: { type: String, required: true },
  position: String,
  role: String,
  isSelected: { type: Boolean, default: false },
  ratings: {
    pace: { type: Number, default: 50 },
    technical: { type: Number, default: 50 },
    physical: { type: Number, default: 50 },
    reliability: { type: Number, default: 50 },
  },
  createdAt: { type: Date, default: Date.now },
  socialLink: String,
});

module.exports = mongoose.model("Player", playerSchema);
