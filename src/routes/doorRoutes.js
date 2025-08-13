module.exports = (app) => {
  const mongoose = require("mongoose");
  const Door = mongoose.model("Door");

  // Database connection check middleware
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

  // Get all doors
  app.get("/api/doors", checkDatabaseConnection, async (req, res) => {
    try {
      const doors = await Door.find().sort({ createdAt: -1 }); // Sort by newest first
      res.json(doors);
    } catch (err) {
      console.error("Fetch doors error:", err);
      res.status(500).json({ 
        error: "Failed to fetch doors", 
        details: err.message 
      });
    }
  });

  // Add a new door
  app.post("/api/doors/add", checkDatabaseConnection, async (req, res) => {
    try {
      // Allow custom _id if provided
      const doorData = { ...req.body };
      
      // If custom _id is provided, validate it's a proper UUID format
      if (doorData._id) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}$/i.test(doorData._id)) {
          return res.status(400).json({ 
            error: "Invalid _id format", 
            message: "_id must be a valid UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx)"
          });
        }
      }
      
      // Validate required fields (only if no custom _id is provided)
      if (!doorData._id) {
        const { name, material, dimensions } = doorData;
        if (!name || !material || !dimensions || !dimensions.height || !dimensions.width) {
          return res.status(400).json({ 
            error: "Missing required fields", 
            required: ["name", "material", "dimensions.height", "dimensions.width"],
            message: "If providing custom _id, all required fields must still be present"
          });
        }
      }
      
      const door = new Door(doorData);
      await door.save();
      res.status(201).json(door);
    } catch (err) {
      console.error("Create door error:", err);
      res.status(400).json({ 
        error: "Failed to create door", 
        details: err.message 
      });
    }
  });

  // Batch save doors
  app.post("/api/doors/batch", checkDatabaseConnection, async (req, res) => {
    try {
      if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({ 
          error: "Request body must be a non-empty array of doors" 
        });
      }
      
      const doors = await Door.insertMany(req.body);
      res.status(201).json(doors);
    } catch (err) {
      console.error("Batch create doors error:", err);
      res.status(400).json({ 
        error: "Failed to batch create doors", 
        details: err.message 
      });
    }
  });

  // Update a door - AUTOMATICALLY UPDATES ALL DOORS WITH SAME MATERIAL
  app.patch("/api/doors/update", checkDatabaseConnection, async (req, res) => {
    try {
      // Handle both _id and id fields for flexibility
      const doorId = req.body._id || req.body.id;
      const updateData = { ...req.body };
      
      // Remove the id fields from update data
      delete updateData._id;
      delete updateData.id;
      
      // Validate that door ID is provided
      if (!doorId) {
        return res.status(400).json({ 
          error: "Door ID is required", 
          message: "Please provide either 'id' or '_id' field in your request body",
          received: Object.keys(req.body)
        });
      }
      
      // Validate that id is a valid UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}$/i.test(doorId)) {
        return res.status(400).json({ 
          error: "Invalid door ID format", 
          message: "ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx)",
          receivedId: doorId
        });
      }
      
      // Validate that there's data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          error: "No update data provided", 
          message: "Please provide fields to update (e.g., DoorFinish, material, etc.)"
        });
      }
      
      console.log(`Updating door ${doorId} with data:`, updateData);
      
      // First, find the door to get its current material
      let door;
      try {
        door = await Door.findOne({ _id: doorId });
      } catch (dbError) {
        console.error("Database find error:", dbError);
        return res.status(500).json({ 
          error: "Database find failed", 
          details: dbError.message 
        });
      }
      
      if (!door) {
        return res.status(404).json({ 
          error: "Door not found", 
          message: `No door found with ID: ${doorId}`,
          searchedId: doorId
        });
      }
      
      // Get the material of the door being updated
      const doorMaterial = door.material;
      console.log(`Door material: ${doorMaterial}`);
      
      // Update ALL doors with the same material
      let updateResult;
      try {
        updateResult = await Door.updateMany(
          { material: doorMaterial }, 
          updateData
        );
        console.log(`Updated ${updateResult.modifiedCount} doors with material: ${doorMaterial}`);
      } catch (dbError) {
        console.error("Database bulk update error:", dbError);
        return res.status(500).json({ 
          error: "Database bulk update failed", 
          details: dbError.message 
        });
      }
      
      // Get the updated door for response
      let updatedDoor;
      try {
        updatedDoor = await Door.findOne({ _id: doorId });
      } catch (dbError) {
        console.error("Database find updated door error:", dbError);
        // Continue anyway since the update was successful
      }
      
      res.json({
        message: "Door update completed successfully - ALL doors with same material updated!",
        door: updatedDoor || door,
        updatedFields: Object.keys(updateData),
        bulkUpdateResult: {
          material: doorMaterial,
          totalDoorsUpdated: updateResult.modifiedCount,
          message: `Updated all ${updateResult.modifiedCount} doors with material: ${doorMaterial}`
        }
      });
      
    } catch (err) {
      console.error("Door update error:", err);
      res.status(400).json({ 
        error: "Failed to update door", 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  // Bulk update doors by criteria (e.g., same material)
  app.patch("/api/doors/bulk-update", checkDatabaseConnection, async (req, res) => {
    try {
      const { criteria, updateData } = req.body;
      
      // Validate criteria and updateData
      if (!criteria || !updateData) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          required: ["criteria", "updateData"],
          message: "Provide criteria to find doors and data to update them with"
        });
      }
      
      // Validate that there's data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          error: "No update data provided", 
          message: "Please provide fields to update (e.g., DoorFinish, material, etc.)"
        });
      }
      
      console.log(`Bulk updating doors with criteria:`, criteria);
      console.log(`Update data:`, updateData);
      
      // Find and update all doors matching the criteria
      let result;
      try {
        result = await Door.updateMany(criteria, updateData);
      } catch (dbError) {
        console.error("Database bulk update error:", dbError);
        return res.status(500).json({ 
          error: "Database bulk update failed", 
          details: dbError.message 
        });
      }
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          error: "No doors found", 
          message: `No doors match the criteria: ${JSON.stringify(criteria)}`,
          criteria: criteria
        });
      }
      
      res.json({
        message: "Bulk update completed successfully",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        criteria: criteria,
        updatedFields: Object.keys(updateData)
      });
      
    } catch (err) {
      console.error("Bulk update error:", err);
      res.status(400).json({ 
        error: "Failed to bulk update doors", 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  // Delete a door
  app.delete("/api/doors/delete", checkDatabaseConnection, async (req, res) => {
    try {
      // Handle both _id and id fields for flexibility
      const doorId = req.body._id || req.body.id;
      
      // Validate that door ID is provided
      if (!doorId) {
        return res.status(400).json({ 
          error: "Door ID is required", 
          message: "Please provide either 'id' or '_id' field in your request body"
        });
      }
      
      // Validate that id is a valid UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}$/i.test(doorId)) {
        return res.status(400).json({ 
          error: "Invalid door ID format", 
          message: "ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx)"
        });
      }
      
      let door;
      try {
        // Find and delete the door using String ID
        door = await Door.findOneAndDelete({ _id: doorId });
      } catch (dbError) {
        console.error("Database delete error:", dbError);
        return res.status(500).json({ 
          error: "Database delete failed", 
          details: dbError.message 
        });
      }
      
      if (!door) {
        return res.status(404).json({ 
          error: "Door not found", 
          message: `No door found with ID: ${doorId}`,
          searchedId: doorId
        });
      }
      res.json({ message: "Door deleted successfully" });
    } catch (err) {
      console.error("Delete door error:", err);
      res.status(400).json({ 
        error: "Failed to delete door", 
        details: err.message 
      });
    }
  });
};
