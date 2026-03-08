require("dotenv").config();

const User = require("./models/User");

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

})
.catch(err => {
    console.error("MongoDB connection failed:", err);
});

// Test route
app.get("/", (req, res) => {
  res.send("Lotus Notes API Running");
});

// User schema
const UserSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model("User", UserSchema);

// Signup
app.post("/signup", async (req, res) => {

  try {

    console.log("Signup request received");
    console.log(req.body);

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      password: hashedPassword
    });

    await user.save();

    console.log("User saved to database");

    res.json({ success: true });

  } catch (error) {

    console.error("Signup error:", error);
    res.status(500).json({ success: false });

  }

});

// Login
app.post("/login", async (req, res) => {

  const { password } = req.body;

  const user = await User.findOne();

  if (!user) {
    return res.json({ success: false });
  }

  const match = await bcrypt.compare(password, user.password);

  if (match) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }

});

// Note schema for storing notes in the database
const NoteSchema = new mongoose.Schema({
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//Note model
const Note = mongoose.model("Note", NoteSchema);
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: String,

  content: String

}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);

// Save note to database
app.post("/notes", async (req, res) => {

  try {

    const { title, content, userId } = req.body;

    const note = new Note({
      title,
      content,
      userId
    });

    await note.save();

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false });

  }

});

//API route to get notes from the database
app.get("/notes", async (req, res) => {

  try {

    const { userId } = req.query;

    const notes = await Note.find({ userId }).sort({ createdAt: -1 });

    res.json(notes);

  } catch (error) {

    res.status(500).json({ success: false });

  }

});


