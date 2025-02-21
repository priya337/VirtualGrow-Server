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
      photo,
      ExteriorPlants,
      InteriorPlants,
    } = req.body;

    // 1. Validate required fields
    if (!email || !password || !name || !photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 2. Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create new user
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
      location,
      photo,
      ExteriorPlants: ExteriorPlants || false,
      InteriorPlants: InteriorPlants || false,
    });

    // 5. Generate tokens for auto-login
    const tokenData = { _id: newUser._id, email: newUser.email };
    const accessToken = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign(tokenData, REFRESH_SECRET, { expiresIn: "7d" });

    // Store refresh token in DB if you want to invalidate later
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // 6. Set HTTP-only cookies for cross-site usage
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",  // for cross-site
      maxAge: 30 * 60 * 1000, // 30 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Return user data
    return res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        location: newUser.location,
        photo: newUser.photo,
        ExteriorPlants: newUser.ExteriorPlants,
        InteriorPlants: newUser.InteriorPlants,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user", message: error.message });
  }
});



// 🔑 Login - Authenticate & Issue Tokens
router.post("/login", async (req, res) => {
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
    const accessToken = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign(tokenData, REFRESH_SECRET, { expiresIn: "7d" });

    // 4. Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Set HTTP-only cookies (cross-site)
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", 
      maxAge: 30 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Return user info
    console.log("Login successful. Sending response...");
    return res.status(200).json({
      message: "Login successful",
      user: { 
        _id: user._id,
        email: user.email,
        name: user.name,
        location: user.location,
        photo: user.photo,
        ExteriorPlants: user.ExteriorPlants,
        InteriorPlants: user.InteriorPlants,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error during login" });
  }
});



// 🔄 Refresh Access Token Automatically (No User Input Required)
router.post("/logout", async (req, res) => {
  try {
    // 1. Get refreshToken from cookies
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token provided" });
    }

    // 2. Find user by refresh token and clear it
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // 3. Clear both cookies
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
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


// In your user routes file
// In your users router file
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    // The 'isAuthenticated' middleware puts the decoded token data on req.user
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the full user document (or select fields you need)
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
