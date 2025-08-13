const mongoose = require("mongoose");

const doorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  material: { type: String, required: true },
  dimensions: {
    height: { type: Number, required: true },
    width: { type: Number, required: true },
  },
  DoorFinish: { type: String },
}, { 
  strict: false,
  timestamps: true
});

mongoose.model("Door", doorSchema);

module.exports = mongoose.model("Door");