import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import aiRoutes from "./routes/ai.routes.js";

export const router = express.Router();
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ API Routes
app.use("/api/ai", aiRoutes); // ✅ FIXED Router Import

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.json({ message: "✅ AI Garden Planner API is running!" });
});

// ❌ Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
