const mongoose = require("mongoose");

const WeatherSchema = new mongoose.Schema(
  {
    garden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garden",
      required: true, // Link this weather data to a specific garden
    },
    temperature: {
      type: Number,
      required: true, // Temperature in Celsius 
    },
    humidity: {
      type: Number,
      required: true, // Humidity as a percentage
    },
    windSpeed: {
      type: Number,
      required: false, // Wind speed in meters per second
    },
    precipitation: {
      type: Number,
      required: false, // Precipitation in mm
    },
    condition: {
      type: String,
      enum: [
        "Sunny",
        "Cloudy",
        "Rainy",
        "Snowy",
        "Windy",
        "Stormy",
        "Foggy",
        "Other",
      ],
      required: true, // Current weather condition
    },
    recordedAt: {
      type: Date,
      default: Date.now, // Timestamp for when this weather data was recorded
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("Weather", WeatherSchema);
