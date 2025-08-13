require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

const credentials = (
  require("fs").existsSync(path.join(__dirname, "credentials.js"))
    ? require("./credentials")
    : console.log("No credentials.js file present")
);

// Database Connection
mongoose
  .connect("mongodb://localhost:27017/revit", { 
    useUnifiedTopology: true, 
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0
  })
  .then(() => console.log("Connected to the Database!"))
  .catch((err) => {
    console.log("Cannot connect to the Database!", err);
    console.log("Server will start without database connection. Database features will be limited.");
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.error('This may cause database operations to fail');
});

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

// Add a helper function to check database connection
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: "Database not connected", 
      status: mongoose.connection.readyState,
      message: "Please try again later or check database connection"
    });
  }
  next();
};

// Models
require("./src/routes/doorModels");

// Routes
require("./src/routes/doorRoutes")(app);

/**
 * Forge Token Caching
 */
let cachedToken = null;
let tokenExpiry = null;

app.get("/token", async (req, res) => {
  try {
    if (cachedToken && new Date() < tokenExpiry) {
      return res.json(cachedToken);
    }

    const response = await axios.post(
      credentials.Authentication,
      new URLSearchParams({
        grant_type: credentials.credentials.grant_type,
        scope: credentials.credentials.scope
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: credentials.credentials.client_id,
          password: credentials.credentials.client_secret
        }
      }
    );
    

    cachedToken = response.data;
    tokenExpiry = new Date(Date.now() + (cachedToken.expires_in - 60) * 1000);

    res.json(cachedToken);

  } catch (err) {
    console.error("Token fetch error:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    res.status(500).json({ error: "Failed to get token", details: err.message });
  }
});


app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to Revit MongoDB Server",
    status: "running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});
