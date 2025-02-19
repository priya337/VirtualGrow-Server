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
    const { email, password, name, age, location, photo, ExteriorPlants, InteriorPlants } = req.body;

    // Check for required fields
    if (!email || !password || !name || !age || !photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate photo file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension = photo.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(`.${fileExtension}`)) {
      return res.status(400).json({ error: "Invalid photo format. Allowed formats: .jpg, .jpeg, .png, .gif" });
    }

    // Check if the user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email is already registered" });

    // Hash the password securely before saving
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create the new user
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
      age,
      location,
      photo,
      ExteriorPlants: ExteriorPlants || false,
      InteriorPlants: InteriorPlants || false,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating user", message: error.message });
  }
});


// 🔑 Login - Authenticate & Issue Tokens
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) return res.status(404).json({ error: "User not found" });

    if (!bcryptjs.compareSync(password, foundUser.password)) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    const tokenData = {
      _id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name
    };

    // Generate tokens
    const accessToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: "30m"
    });
    const refreshToken = jwt.sign(tokenData, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d"
    });

    // ✅ Store refresh token in MongoDB
    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    // ✅ Store refresh token in a secure HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true if HTTPS
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ---------------------------------------------------------------
    // ADD THIS LINE: store the ACCESS token in an HTTP-only cookie too
    // ---------------------------------------------------------------
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000, // 30 minutes in ms
    });

    // ✅ Send access token & refresh token in JSON response (unchanged)
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error logging in user", message: error.message });
  }
});



// 🔄 Refresh Access Token Automatically (No User Input Required)
router.post("/refresh-token", async (req, res) => {
  try {
    console.log("Cookies received:", req.cookies); // Debugging

    const refreshToken = req.cookies.refreshToken; // Get refresh token from secure cookie
    if (!refreshToken) {
      return res.status(403).json({ error: "No refresh token provided" });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log("JWT Verification Error:", err.message);
        return res.status(403).json({ error: "Invalid or expired refresh token" });
      }

      console.log("Decoded Token:", decoded);

      // Find the user in MongoDB
      const user = await UserModel.findOne({ _id: decoded._id });

      if (!user || !user.refreshToken) {
        console.log("User not found or no refresh token stored in DB.");
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      console.log("Stored Refresh Token in DB:", user.refreshToken);
      console.log("Received Refresh Token from Cookie:", refreshToken);

      if (user.refreshToken !== refreshToken) {
        return res.status(403).json({ error: "Refresh token mismatch" });
      }

      // Generate a new access token
      const newAccessToken = jwt.sign(
        { _id: user._id, email: user.email, name: user.name },
        process.env.TOKEN_SECRET,
        { expiresIn: "30m" }
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Unexpected Error:", error.message);
    res.status(500).json({ error: "Error refreshing token", message: error.message });
  }
});

router.delete('/delete', isAuthenticated, deleteUserProfile);

// 🆕 Get User Profile by Email
router.get("/profile/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const user = await UserModel.findOne({ email }).select("-password -refreshToken"); // Exclude sensitive data
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user profile", message: error.message });
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



// 🔓 Logout - Securely Remove Refresh Token
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(400).json({ error: "No refresh token provided" });

    // Find user and remove refresh token
    const user = await UserModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // Clear the HTTP-only cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error logging out", message: error.message });
  }
});

export default router;
