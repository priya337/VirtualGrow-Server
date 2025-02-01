const express = require("express");
const router = express.Router();
const AI = require("../models/AI.model");

// 🤖 Create an AI Task (Only Required Fields)
router.post("/", async (req, res) => {
  try {
    const { user, task, inputType, inputData } = req.body;

    // Ensure required fields are present
    if (!user || !task || !inputType || !inputData) {
      return res.status(400).json({ error: "Missing required fields: user, task, inputType, and inputData" });
    }

    const aiTask = await AI.create({ user, task, inputType, inputData });

    res.status(201).json(aiTask);
  } catch (error) {
    res.status(500).json({ error: "Error creating AI task", message: error.message });
  }
});

// 📂 Get All AI Tasks (Populating User Info)
router.get("/", async (req, res) => {
  try {
    const aiTasks = await AI.find().populate("user");
    res.json(aiTasks);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving AI tasks", message: error.message });
  }
});

// 🔍 Get AI Task by ID (Populates User Info)
router.get("/:id", async (req, res) => {
  try {
    const aiTask = await AI.findById(req.params.id).populate("user");

    if (!aiTask) return res.status(404).json({ error: "AI task not found" });

    res.json(aiTask);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving AI task", message: error.message });
  }
});

// ✏️ Update AI Task (Only Specific Fields Allowed)
router.put("/:id", async (req, res) => {
  try {
    const { inputData, result, status } = req.body;

    const updatedAITask = await AI.findByIdAndUpdate(
      req.params.id,
      { inputData, result, status },
      { new: true }
    );

    if (!updatedAITask) return res.status(404).json({ error: "AI task not found" });

    res.json(updatedAITask);
  } catch (error) {
    res.status(500).json({ error: "Error updating AI task", message: error.message });
  }
});

// 🗑️ Delete AI Task
router.delete("/:id", async (req, res) => {
  try {
    const deletedAITask = await AI.findByIdAndDelete(req.params.id);

    if (!deletedAITask) return res.status(404).json({ error: "AI task not found" });

    res.json({ message: "AI task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting AI task", message: error.message });
  }
});

// 🌱 Generate AI-Driven Garden Layout
router.post("/garden-layout", async (req, res) => {
  try {
    const { user, inputData } = req.body;

    // Ensure required fields are present
    if (!user || !inputData) {
      return res.status(400).json({ error: "Missing required fields: user and inputData" });
    }

    // Simulated AI logic - Generate structured garden layout
    const generatedLayout = {
      gardenZones: {
        vegetableBed: "4 ft x 10 ft (center)",
        flowerBed: "4 ft x 10 ft (left)",
        herbGarden: "4 ft x 10 ft (right)",
        pathways: "2 ft wide between zones",
        borderPlants: "2 ft wide ornamental border",
      },
      plantPlacement: {
        vegetableBed: ["Tomatoes", "Lettuce", "Carrots", "Bell Peppers", "Zucchini"],
        flowerBed: ["Sunflowers", "Coneflowers", "Marigolds"],
        herbGarden: ["Basil", "Rosemary", "Thyme", "Chives"],
        borderPlants: ["Lavender", "Daylilies"],
      },
      seasonalPlan: {
        Spring: ["Start seeds indoors", "Plant carrots and lettuce outdoors"],
        Summer: ["Harvest herbs", "Thin out lettuce and carrots"],
        Fall: ["Prepare soil for winter", "Mulch around perennials"],
        Winter: ["Plan for next year", "Maintain mulch"],
      },
    };

    // Save AI Task
    const aiTask = await AI.create({
      user,
      task: "GardenLayout",
      inputData,
      result: generatedLayout,
      status: "Completed",
    });

    res.status(201).json({ message: "Garden layout generated successfully!", data: aiTask });
  } catch (error) {
    res.status(500).json({ error: "Error generating garden layout", message: error.message });
  }
});

module.exports = router;
