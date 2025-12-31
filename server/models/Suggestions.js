const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: {
    type: String,
    enum: ["Rating", "Feature", "Bug"],
    default: "Feature",
  },
  status: {
    type: String,
    enum: ["Pending", "Planned", "Done"],
    default: "Pending",
  },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Suggestion", suggestionSchema);
