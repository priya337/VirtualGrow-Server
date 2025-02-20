const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const FRONTEND_URL = "https://virtual-grow.netlify.app"; // ✅ Production frontend
const LOCAL_FRONTEND = "http://localhost:5173"; // ✅ Local frontend for development

// Middleware configuration
module.exports = (app) => {
  // ✅ Trust proxy for cloud deployments (Render, Heroku, etc.)
  app.set("trust proxy", 1);

  // ✅ Allow CORS for all origins (*)
  app.use(
    cors({
      origin: "https://virtual-grow.netlify.app", // ✅ Allow ALL origins (use with caution!)
      credentials: true, // ✅ Allow cookies & authentication headers
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Allowed HTTP methods
      allowedHeaders: ["Content-Type", "Authorization"], // ✅ Allowed headers
    })
  );

  // ✅ Ensure all responses have CORS headers (for preflight requests)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // ✅ Allow all origins
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200); // ✅ Handles preflight requests properly
    }

    next();
  });

  // ✅ Log HTTP requests in development mode
  app.use(logger("dev"));

  // ✅ Enable JSON parsing for incoming requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // ✅ Enable cookie parsing (needed for refresh token storage)
  app.use(cookieParser());

  console.log("🚀 CORS is temporarily open for all origins!");
};
