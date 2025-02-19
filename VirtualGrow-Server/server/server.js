import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ Import user routes
import cookieParser from "cookie-parser";

dotenv.config(); // ✅ Load environment variables

const app = express();

// ✅ CORS Configuration - Allow Requests from Netlify
const allowedOrigins = [
  "https://virtual-grow.netlify.app",  // ✅ Netlify frontend
  "http://localhost:5176",             // ✅ Local dev (Vite default port)
  "http://localhost:3000"              // ✅ Local React dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ✅ Allow cookies/sessions
  })
);

console.log("✅ CORS Configured for:", allowedOrigins);

app.use(express.json());
app.use(cookieParser());

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

console.log("🔍 Initializing Server...");

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
