const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const FRONTEND_URL = "https://virtual-grow.netlify.app"; // Production frontend
const LOCAL_FRONTEND = "http://localhost:5173"; // Local frontend for development

module.exports = (app) => {
  // For cloud deployments (e.g., Render), trust the proxy
  app.set("trust proxy", 1);

  // 1. Set up CORS with credentials for a single (or multiple) known origin(s)
  app.use(
    cors({
      origin: [FRONTEND_URL, LOCAL_FRONTEND], // or [FRONTEND_URL, LOCAL_FRONTEND] if you want to allow both
      credentials: true,    // Allow cookies to be sent
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // 2. (Optional) If you want to explicitly handle preflight requests:
  // app.options("*", cors());

  // 3. Log HTTP requests (helpful in development)
  app.use(logger("dev"));

  // 4. Enable JSON parsing for incoming requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 5. Enable cookie parsing (needed for refresh token storage, etc.)
  app.use(cookieParser());

  console.log("🚀 CORS configured for:", FRONTEND_URL);
};
