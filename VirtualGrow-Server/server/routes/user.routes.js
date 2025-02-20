import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
import dotenv from "dotenv";
import isAuthenticated from '../middleware/auth.middleware.js';
import { deleteUserProfile } from '../controllers/userController.js';
import cookieParser from "cookie-parser";


dotenv.config();
const router = express.Router();





// 🔐 Signup - Register User (With Image Validation)
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      location,
      photo, // Now the front end always sends this
      ExteriorPlants,
      InteriorPlants,
    } = req.body;

    // Check for required fields
    // If you want photo to be mandatory, keep it here
    // If you want it optional, remove `|| !photo`
    if (!email || !password || !name || !photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // ✅ Validate photo file extension (optional)
    // If your front end always sends a Pollinations URL, you may not need this check
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension = photo.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(`.${fileExtension}`)) {
      return res
        .status(400)
        .json({ error: "Invalid photo format. Allowed: .jpg, .jpeg, .png, .gif" });
    }

    // Create new user
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
      location,
      photo, // Just store whatever URL was sent from the front end
      ExteriorPlants: ExteriorPlants || false,
      InteriorPlants: InteriorPlants || false,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user", message: error.message });
  }
});



// 🔑 Login - Authenticate & Issue Tokens
// user.routes.js (example)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Validate user
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check password (pseudo-code)
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(403).json({ error: "Invalid credentials" });

    // 2. Generate tokens
    const tokenData = { _id: user._id, email: user.email };
    const accessToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign(tokenData, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    // 3. Save refresh token in DB (optional)
    user.refreshToken = refreshToken;
    await user.save();

    // 4. Return tokens + user in JSON
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        // add more fields if needed
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});



// 🔄 Refresh Access Token Automatically (No User Input Required)
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token provided" });
    }

    // Find user by refreshToken, clear it
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error logging out", message: error.message });
  }
});


router.delete('/delete', async (req, res) => {
  try {
    // For example, just remove the user by their email or ID
    const { email } = req.body; // or some unique identifier
    await UserModel.deleteOne({ email });
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong", message: error.message });
  }
});


// 🔓 Logout - Securely Remove Tokens
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token provided" });
    }

    // Find user by refresh token and remove it
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // Clear the refreshToken cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // or 'true' if always HTTPS
      sameSite: "Strict",
    });

    // Also clear the accessToken cookie if you're using it
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error logging out", message: error.message });
  }
});



export default router;
