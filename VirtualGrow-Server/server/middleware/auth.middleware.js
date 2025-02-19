const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = isAuthenticated;
