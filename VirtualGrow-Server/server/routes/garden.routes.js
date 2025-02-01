const express = require("express");
const router = express.Router();
const Garden = require("../models/Garden.model");

// 🌱 Create a New Garden (Only Required Fields)
router.post("/", async (req, res) => {
  try {
    const { name, location, size, createdBy } = req.body;

    // Ensure required fields are present
    if (!name || !size || !createdBy) {
      return res.status(400).json({ error: "Missing required fields: name, size, and createdBy" });
    }

    const newGarden = await Garden.create({ name, location, size, createdBy });
    res.status(201).json(newGarden);
  } catch (error) {
    res.status(500).json({ error: "Error creating garden", message: error.message });
  }
});

// 📂 Get All Gardens (Populates Plants, Weather, and AI Tasks)
router.get("/", async (req, res) => {
  try {
    const gardens = await Garden.find().populate("plants weather aiTasks");
    res.json(gardens);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving gardens", message: error.message });
  }
});

// 🔍 Get a Single Garden by ID (Populates Linked Data)
router.get("/:id", async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id).populate("plants weather aiTasks");
    if (!garden) return res.status(404).json({ error: "Garden not found" });
    res.json(garden);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving garden", message: error.message });
  }
});

// ✏️ Update a Garden (Only Allows Updating Specific Fields)
router.put("/:id", async (req, res) => {
  try {
    const { name, location, size } = req.body;
    const updatedGarden = await Garden.findByIdAndUpdate(
      req.params.id,
      { name, location, size },
      { new: true }
    );
    if (!updatedGarden) return res.status(404).json({ error: "Garden not found" });
    res.json(updatedGarden);
  } catch (error) {
    res.status(500).json({ error: "Error updating garden", message: error.message });
  }
});

// 🗑️ Delete a Garden
router.delete("/:id", async (req, res) => {
  try {
    const deletedGarden = await Garden.findByIdAndDelete(req.params.id);
    if (!deletedGarden) return res.status(404).json({ error: "Garden not found" });
    res.json({ message: "Garden deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting garden", message: error.message });
  }
});

module.exports = router;
