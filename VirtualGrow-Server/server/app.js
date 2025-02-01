// ℹ️ Load environment variables
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles HTTP requests (Express framework)
const express = require("express");
const app = express();

// Import Middleware
require("./config/middleware.config")(app);
const isAuthenticated = require("./middlewares/auth.middleware"); // 🔐 Auth Middleware
const errorHandler = require("./middlewares/error.middleware"); // ❗ Error Middleware

// 👇 Import Routes
const gardenRoutes = require("./routes/garden.routes");
const weatherRoutes = require("./routes/weather.routes");
const aiRoutes = require("./routes/ai.routes");
const userRoutes = require("./routes/user.routes");
const plantRoutes = require("./routes/plant.routes");

// Use Routes
app.use("/api/gardens", gardenRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plants", plantRoutes);

// ❗ Error Handling Middleware
app.use(errorHandler);

module.exports = app;
