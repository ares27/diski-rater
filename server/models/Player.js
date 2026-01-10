const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  diskiName: { type: String, required: true },
  area: { type: String, required: true },
  position: String,
  preferredFoot: { type: String, default: "Right" }, // New
  kitNumber: { type: String, default: "#?" }, // New
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
  isPioneer: { type: Boolean, default: false },
  careerStats: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },
    mvps: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
  },
  lastChange: {
    technical: { type: Number, default: 0 },
    pace: { type: Number, default: 0 },
    physical: { type: Number, default: 0 },
    reliability: { type: Number, default: 0 },
  },
  form: {
    type: [String],
    default: [],
    validate: [arrayLimit, "{PATH} exceeds the limit of 5"],
  },
});

function arrayLimit(val) {
  return val.length <= 5;
}

// PRE-SAVE HOOK: Ensures ratings stay within 0-99 range
playerSchema.pre("save", function (next) {
  const r = this.ratings;

  // Define the attributes to check
  const keys = ["technical", "pace", "physical", "reliability"];

  keys.forEach((key) => {
    // Round to 1 decimal place for clean UI
    this.ratings[key] = Math.round(this.ratings[key] * 10) / 10;

    // Apply Hard Caps
    if (this.ratings[key] > 99) this.ratings[key] = 99;
    if (this.ratings[key] < 0) this.ratings[key] = 0;
  });

  next();
});

module.exports = mongoose.model("Player", playerSchema);
