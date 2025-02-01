const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Unauthorized: Invalid token" });
    }

    req.user = decoded; // Attach decoded user data to request
    next();
  });
};

module.exports = isAuthenticated;
