const express = require("express");
const router = express.Router();
const PlantModel = require("../models/Plant.model");

// 🌱 Create a New Plant (Only Required Fields)
router.post("/create", async (req, res) => {
  try {
    const { name, plantType, wateringFrequency, garden, createdBy } = req.body;

    // Ensure required fields are present
    if (!name || !plantType || !wateringFrequency || !garden || !createdBy) {
      return res.status(400).json({ error: "Missing required fields: name, plantType, wateringFrequency, garden, and createdBy" });
    }

    const createdPlant = await PlantModel.create({ name, plantType, wateringFrequency, garden, createdBy });

    console.log("✅ Plant created:", createdPlant);
    res.status(201).json({ message: "Plant created", createdPlant });
  } catch (error) {
    console.log("❌ Error creating plant:", error);
    res.status(500).json({ message: "Error creating a plant", error: error.message });
  }
});

// 📂 Get All Plants for a User
router.get("/allPlants/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allPlants = await PlantModel.find({ createdBy: userId }).populate("garden");
    
    if (!allPlants.length) return res.status(404).json({ error: "No plants found for this user" });

    console.log("✅ All user plants:", allPlants);
    res.status(200).json({ allPlants });
  } catch (error) {
    console.log("❌ Error retrieving plants:", error);
    res.status(500).json({ message: "Error getting your plants", error: error.message });
  }
});

// 🔍 Get a Single Plant by ID
router.get("/:id", async (req, res) => {
  try {
    const plant = await PlantModel.findById(req.params.id).populate("garden");

    if (!plant) return res.status(404).json({ error: "Plant not found" });

    res.status(200).json(plant);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving plant", error: error.message });
  }
});

// ✏️ Update a Plant (Only Specific Fields Allowed)
router.put("/edit/:id", async (req, res) => {
  try {
    const { name, plantType, wateringFrequency } = req.body;

    const updatedPlant = await PlantModel.findByIdAndUpdate(
      req.params.id,
      { name, plantType, wateringFrequency },
      { new: true }
    );

    if (!updatedPlant) return res.status(404).json({ error: "Plant not found" });

    res.status(200).json(updatedPlant);
  } catch (error) {
    res.status(500).json({ message: "Error updating plant", error: error.message });
  }
});

// 🗑️ Delete a Plant
router.delete("/:id", async (req, res) => {
  try {
    const deletedPlant = await PlantModel.findByIdAndDelete(req.params.id);

    if (!deletedPlant) return res.status(404).json({ error: "Plant not found" });

    res.status(200).json({ message: "Plant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting plant", error: error.message });
  }
});

module.exports = router;
