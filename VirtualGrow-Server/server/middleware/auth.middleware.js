const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  try {
    // Attempt to get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error("🔒 Token verification failed:", err.message);
        return res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
      }

      req.user = decoded; // Attach decoded user data to request
      next();
    });
  } catch (error) {
    console.error("🚨 Error in authentication middleware:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = isAuthenticated;
