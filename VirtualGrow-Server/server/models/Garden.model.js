// Import Mongoose
const mongoose = require('mongoose');

// Define the Garden schema
const GardenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: false,
        trim: true
    },
    size: {
        type: Number, 
        required: true,
        min: 1
    },
    plants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant' 
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add a pre-save hook to update the 'updatedAt' field
GardenSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create and export the Garden model
const Garden = mongoose.model('Garden', GardenSchema);
module.exports = Garden;
