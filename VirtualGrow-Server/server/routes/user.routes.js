import express from "express";
import bcrypt from "bcryptjs";
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
    // If you want it optional, remove || !photo
    if (!email || !password || !name || !photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Validate photo file extension (optional)
    // If your front end always sends a Pollinations URL, you may not need this check
    // const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    // const fileExtension = photo.split(".").pop().toLowerCase();
    // if (!allowedExtensions.includes(.${fileExtension})) {
    //   return res
    //     .status(400)
    //     .json({ error: "Invalid photo format. Allowed: .jpg, .jpeg, .png, .gif" });
    // }

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
router.post("/login",isAuthenticated, async (req, res) => {
  try {
    console.log("Login route hit. Request body:", req.body);

    const { email, password } = req.body;

    // 1. Validate user by email
    const user = await UserModel.findOne({ email });
    console.log("User found in DB:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match status:", isMatch);

    if (!isMatch) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    // 3. Generate tokens
    const tokenData = { _id: user._id, email: user.email };
    const accessToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign(tokenData, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    // 4. Save refresh token in DB (if you want to invalidate later)
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Set HTTP-only cookies for both tokens
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 6. Optionally return user info
    console.log("Login successful. Sending response...");
    return res.status(200).json({
      message: "Login successful",
      user: { email: user.email, name: user.name },
      accessToken,       // include the access token
      refreshToken
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error during login" });
  }
});


// 🔄 Refresh Access Token Automatically (No User Input Required)
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // read from cookie
    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token provided" });
    }

    // Find user by refreshToken and clear it
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // Clear the refreshToken cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Also clear the accessToken cookie if you want
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
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
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong", message: error.message });
  }
});


// In your users router file
router.get("/profile",  isAuthenticated, async (req, res) => {
  try {
    // Debug: see what's inside req.user
    console.log("Decoded user in /profile:", req.user);

    // If your JWT has _id, do this:
    const userId = req.user?._id; 
    // If it uses id instead, do: const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user document
    res.status(200).json(user);
  } catch (err) {
    console.error("Server error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// 🔓 Logout - Securely Remove Tokens
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies; // read from cookies now
    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token provided" });
    }

    // 1. Find user by refresh token, clear it
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // 2. Clear both cookies
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error logging out", message: error.message });
  }
});

export default router; 