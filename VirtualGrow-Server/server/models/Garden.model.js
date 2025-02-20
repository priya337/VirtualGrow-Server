import mongoose from "mongoose";

const gardenSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  gardenSize: {
    length: Number,
    breadth: Number,
  },
  preferredPlants: [String],
  gardenPlanOverview: Object,
  imageUrl: { type: String }, // <-- Add this line
});

const Garden = mongoose.model("Garden", gardenSchema);
export default Garden;
