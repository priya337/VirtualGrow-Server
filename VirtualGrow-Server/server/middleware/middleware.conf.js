const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

module.exports = (app) => {
  app.use(cors()); // 🌍 Enable CORS
  app.use(morgan("dev")); // 📝 Log requests
  app.use(compression()); // 🚀 Optimize response sizes
  app.use(express.json()); // 📦 Parse JSON body
};
