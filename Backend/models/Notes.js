const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  title: String,
  content: String
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);