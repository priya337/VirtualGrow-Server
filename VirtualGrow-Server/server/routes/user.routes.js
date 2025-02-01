const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Used for generating reset tokens
const UserModel = require("../models/User.model");

const router = express.Router();
const nodemailer = require("nodemailer");

// Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token
  if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Unauthorized: Invalid token" });

    req.user = decoded; // Attach decoded user info to request
    next();
  });
};

// Storage for refresh tokens (Ideally use a database for persistent storage)
let refreshTokens = new Set();

// 🔐 Signup - Create a New User
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, age, location, photo, ExteriorPlants, InteriorPlants } = req.body;

    if (!email || !password || !name || !age || !photo) {
      return res.status(400).json({ error: "Missing required fields: email, password, name, age, and photo" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const salt = bcryptjs.genSaltSync(12);
    const hashedPassword = bcryptjs.hashSync(password, salt);

    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
      age,
      location,
      photo,
      ExteriorPlants: ExteriorPlants || false,
      InteriorPlants: InteriorPlants || false
    });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Error creating user", message: error.message });
  }
});

// 🔑 Login - Authenticate User & Generate JWT Tokens
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" }); // ✅ User not found
    }

    const passwordsMatch = bcryptjs.compareSync(password, foundUser.password);
    if (!passwordsMatch) {
      return res.status(403).json({ error: "Invalid credentials" }); // ✅ Incorrect password
    }

    // Generate JWT Tokens
    const tokenData = { _id: foundUser._id, name: foundUser.name, email: foundUser.email };
    const accessToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign(tokenData, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    refreshTokens.add(refreshToken);

    res.status(200).json({ message: "Login successful", accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: "Error logging in user", message: error.message });
  }
});

// 🔍 Get User Profile (Protected)
router.get("/profile/:email", verifyToken, async (req, res) => {
  try {
    const requestedEmail = req.params.email;
    const loggedInUserEmail = req.user.email;

    if (requestedEmail !== loggedInUserEmail) {
      return res.status(403).json({ error: "Unauthorized: Access denied" });
    }

    const user = await UserModel.findOne({ email: requestedEmail }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user profile", message: error.message });
  }
});

// 🔄 Refresh Access Token
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: "Unauthorized: Invalid refresh token" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Unauthorized: Invalid refresh token" });

    const newAccessToken = jwt.sign({ _id: user._id, email: user.email, name: user.name }, process.env.TOKEN_SECRET, {
      expiresIn: "30m",
    });

    res.status(200).json({ accessToken: newAccessToken });
  });
});

// 🔑 Forgot Password (User Only Provides Email)
router.post("/forgot-password", async (req, res) => {
  try {
      const { email } = req.body;

      // Check if user exists
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Generate reset token (you may want to store this in the database)
      const resetToken = Math.random().toString(36).substr(2); // Simple token (consider JWT or UUID instead)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1-hour expiry
      await user.save();

      console.log(`Password reset request for ${email}`);

      // Configure email transporter
      const transporter = nodemailer.createTransport({
          service: "Gmail", // or use SMTP settings
          auth: {
              user: process.env.EMAIL_USER, // Your email
              pass: process.env.EMAIL_PASS, // Your app password
          },
      });

      // Email details
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset Request",
          text: `Click the following link to reset your password: http://localhost:5175/reset-password?token=${resetToken}`,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
      res.status(500).json({ error: "Error processing password reset", message: error.message });
  }
});

// 🔓 Reset Password (User Enters Email & New Password)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await UserModel.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() } // Check if reset is still valid
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired password reset request" });

    const salt = bcryptjs.genSaltSync(12);
    const hashedPassword = bcryptjs.hashSync(newPassword, salt);

    await UserModel.findByIdAndUpdate(
      user._id,
      { password: hashedPassword, resetPasswordExpires: undefined },
      { new: true, runValidators: false }
    );

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error resetting password", message: error.message });
  }
});

// ❌ DELETE User by ID
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User deleted successfully", deletedUser });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user", message: error.message });
  }
});

// ❌ DELETE User Profile by Email (Without Bearer Token)
router.delete("/delete-profile/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const deletedUser = await UserModel.findOneAndDelete({ email });
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user profile", message: error.message });
  }
});

module.exports = router;
