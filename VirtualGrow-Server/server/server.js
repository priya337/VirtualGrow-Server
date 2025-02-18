import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ Import user routes
import cookieParser from "cookie-parser";

dotenv.config(); // ✅ Load environment variables

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

console.log("🔍 Initializing Server...");

// ✅ CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,  // ✅ Allow frontend deployment URL from .env
  "http://localhost:5173",   // ✅ Vite Default Dev Server
  "http://localhost:3000",   // ✅ React Dev Server (if applicable)
].filter(Boolean);  // ✅ Remove undefined values

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*", // ✅ Fallback to "*" only for debugging
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Ensure all HTTP methods are allowed
    credentials: true, // ✅ Allow cookies/sessions
  })
);

console.log("✅ CORS Configured with Allowed Origins:", allowedOrigins);

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

// ✅ Register Routes
console.log("🔍 Registering Routes...");
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

// ✅ Start Server
const PORT = process.env.PORT || 5007;
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
