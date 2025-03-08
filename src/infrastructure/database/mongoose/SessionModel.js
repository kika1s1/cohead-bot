import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["pair_programming", "moon_walk", "grouping"],
    required: true,
  },
  group: { type: String, required: true },
  pairs: {
    type: [[{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]],
    required: true,
  },
  questions: [{ title: String, link: String, difficulty: String }],
  createdAt: { type: Date, default: Date.now },
});

export const SessionModel = mongoose.model("Session", sessionSchema);
