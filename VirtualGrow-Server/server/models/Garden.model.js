import mongoose from "mongoose";

const gardenSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // ✅ Add garden name
  gardenSize: {
    length: Number,
    breadth: Number
  },
  preferredPlants: [String],
  gardenPlanOverview: Object
});

const Garden = mongoose.model("Garden", gardenSchema);
export default Garden;
