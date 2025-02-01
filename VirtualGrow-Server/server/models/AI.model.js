const mongoose = require("mongoose");

const AISchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Link to the user who requested AI recommendations
    },
    garden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garden",
      required: false, // Optional link to a specific garden
    },
    inputType: {
      type: String,
      enum: ["Image", "Text", "Other"],
      required: true, // What type of input was provided for AI processing
    },
    inputData: {
      type: String,
      required: true, // The actual data (e.g., base64 image, text, etc.)
    },
    task: {
      type: String,
      enum: [
        "PlantRecommendation", 
        "DiseaseDetection", 
        "WateringSchedule", 
        "GeneralAdvice",
      ],
      required: true, // The AI task being performed
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: false, // Result of the AI task (e.g., JSON object, text, etc.)
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending", // Tracks the status of the AI task
    },
    error: {
      type: String,
      required: false, // Stores error details if the AI task fails
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("AI", AISchema);
