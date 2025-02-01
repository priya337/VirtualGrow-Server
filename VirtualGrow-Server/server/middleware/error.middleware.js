const errorHandler = (err, req, res, next) => {
    console.error("❌ Error:", err.message || "Unknown error");
  
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  };
  
  module.exports = errorHandler;
  