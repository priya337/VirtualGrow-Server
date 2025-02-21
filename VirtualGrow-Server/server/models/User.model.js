const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required."]
    },
    name: { 
      type: String,
      required: [true, "Name is required."]
    },  
    age: { 
      type: Number,
      required: [false, "Age is required."]
    },
    location: { 
      type: String
    }, 
    photo: { 
      type: String,
      required: [true, "Photo is required."]
    },
    ExteriorPlants: { 
      type: Boolean,
      default: true
    },
    InteriorPlants: { 
      type: Boolean,
      default: true
    },
    resetPasswordToken: { type: String }, // ✅ Store reset token
    resetPasswordExpires: { type: Date }, // ✅ Expiry time for reset token
    refreshToken: { type: String, default: null } // ✅ Added refreshToken field
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
