import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ Import user routes
import cookieParser from "cookie-parser";



dotenv.config(); // Load environment variables

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Debugging Log
console.log("🔍 Initializing Server...");

// ✅ CORS Configuration (Allow Frontend Deployment URL & Local Dev)
const allowedOrigins = [
  process.env.FRONTEND_URL,  // ✅ Frontend deployment URL from .env
  "http://localhost:5176"    // ✅ Local frontend for development
].filter(Boolean);  // Remove undefined values

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*", // ✅ Temporary Debugging: Allow all origins if undefined
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

console.log("✅ CORS Configured with Allowed Origins:", allowedOrigins);

app.use(cookieParser());

// ✅ MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("❌ MongoDB URI is missing. Set MONGODB_URI in .env");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Debugging Log for Route Registration
console.log("🔍 Registering Routes...");

// ✅ API Routes
app.use("/api/ai", aiRoutes);
console.log("✅ AI Routes Registered at /api/ai");

app.use("/api/users", userRoutes);
console.log("✅ User Routes Registered at /api/users");

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.json({ message: "✅ AI Garden Planner API is running!" });
});

// ❌ Handle Undefined Routes (Moved to the End)
app.use((req, res) => {
  console.log(`❌ Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server - Use Only `process.env.PORT` for Render Deployment
const PORT = process.env.PORT || 5007;
if (!PORT) {
  console.error("❌ PORT is missing in environment variables.");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// 🔹 Graceful Shutdown
process.on("SIGINT", () => {
  console.log("🛑 Gracefully shutting down...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed.");
    process.exit(0);
  });
});
