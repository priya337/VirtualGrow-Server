require("dotenv").config();
const express = require("express");
const mongoose = require("./db/index");
const cors = require("cors");

const app = express();
app.use(express.json()); // Parse JSON body
app.use(cors()); // Allow frontend communication

// Import routes
const gardenRoutes = require("./routes/garden.routes.js");
const weatherRoutes = require("./routes/weather.routes.js");
const aiRoutes = require("./routes/ai.routes.js");
const userRoutes = require("./routes/user.routes.js"); // 🔐 Added User Routes
const plantRoutes = require("./routes/plant.routes.js"); // 🌱 Added Plant Routes

// Use routes
app.use("/api/gardens", gardenRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes); // 🔐 Users
app.use("/api/plants", plantRoutes); // 🌱 Plants

// ❌ Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ℹ️ Set the PORT for our app
const PORT = process.env.PORT || 5005;

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
