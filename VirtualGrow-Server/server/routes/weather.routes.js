const express = require("express");
const router = express.Router();
const Weather = require("../models/Weather.model");

// 🌦️ Create Weather Data (Only Required Fields)
router.post("/", async (req, res) => {
  try {
    const { garden, temperature, humidity, condition } = req.body;

    // Ensure required fields are present
    if (!garden || temperature === undefined || humidity === undefined || !condition) {
      return res.status(400).json({ error: "Missing required fields: garden, temperature, humidity, and condition" });
    }

    const newWeather = await Weather.create({ garden, temperature, humidity, condition });

    res.status(201).json(newWeather);
  } catch (error) {
    res.status(500).json({ error: "Error creating weather data", message: error.message });
  }
});

// 📂 Get All Weather Data (Populating Garden Info)
router.get("/", async (req, res) => {
  try {
    const weatherData = await Weather.find().populate("garden");
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving weather data", message: error.message });
  }
});

// 🔍 Get Weather for a Specific Garden (Populates Garden Info)
router.get("/:id", async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id).populate("garden");

    if (!weather) return res.status(404).json({ error: "Weather data not found" });

    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving weather data", message: error.message });
  }
});

// ✏️ Update Weather Data (Only Specific Fields Allowed)
router.put("/:id", async (req, res) => {
  try {
    const { temperature, humidity, condition } = req.body;

    const updatedWeather = await Weather.findByIdAndUpdate(
      req.params.id,
      { temperature, humidity, condition },
      { new: true }
    );

    if (!updatedWeather) return res.status(404).json({ error: "Weather data not found" });

    res.json(updatedWeather);
  } catch (error) {
    res.status(500).json({ error: "Error updating weather data", message: error.message });
  }
});

// 🗑️ Delete Weather Data
router.delete("/:id", async (req, res) => {
  try {
    const deletedWeather = await Weather.findByIdAndDelete(req.params.id);

    if (!deletedWeather) return res.status(404).json({ error: "Weather data not found" });

    res.json({ message: "Weather data deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting weather data", message: error.message });
  }
});

module.exports = router;
