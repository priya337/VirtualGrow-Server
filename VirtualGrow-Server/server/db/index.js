const mongoose = require("mongoose");

// ℹ️ Direct MongoDB Atlas URI
const MONGO_URI = "mongodb+srv://ironhack:aohLhWNlRMnBWMua@cluster0.mwc75.mongodb.net/VirtualGrow-Server?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((x) => {
    console.log(`✅ Connected to MongoDB: ${x.connections[0].name}`);
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

module.exports = mongoose;
