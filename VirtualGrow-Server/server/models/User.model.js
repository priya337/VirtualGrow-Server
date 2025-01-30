const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required.']
    },
    name: { 
      type: String,
      required: [true, 'Name is required.']
    },  
    age: { 
      type: Number,
      required: true,
    },
    location: { 
      type: String,
    }, 
    photo: { 
      type: String,
      required: true,
    },
    ExteriorPlants: { 
      type: Boolean,
    },
    InteriorPlants: { 
      type: Boolean,
    },      
  },
{
  timestamps: true,
}
);

const UserModel = model("User", userSchema);

module.exports = UserModel;
