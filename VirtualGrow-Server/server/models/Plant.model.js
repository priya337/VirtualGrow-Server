const { Schema, model } = require("mongoose");

const PlantSchema = new Schema({
    scientificName: {
    type: String,
  },
  commonName: {
    type: String,
  },
  origin: {
    type: String,
    
  },
  family: {
    type: String,
  },
  preferedLocation: {
    type: String,
    
  },
  light: {
    type: String,
    
  },
  humidity: {
    type: String,
  },
  watering: {
    type: String,
    
  },
  fertilizing: {
    type: String,
  },
  substrate: {
    type: String,
  },
  prunning: {
    type: String,
  },
  flowering: {
    type: Boolean,

  }
});

const PlantModel = model("plants", PlantSchema);
module.exports = PlantModel;