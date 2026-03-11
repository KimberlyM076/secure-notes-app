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

// Signup
app.post("/signup", async (req, res) => {

  try {

    console.log("Signup request received");
    console.log(req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
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

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    res.json({
      success: true,
      userId: user._id
    });

  } catch (error) {

    console.error("Login error:", error);
    res.status(500).json({ success: false });

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
const Note = require("./models/Notes");

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

//Delete note from database
app.delete("/notes/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;

    await Note.findByIdAndDelete(noteId);
    res.json({ success: true });

  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ success: false });
  }
});
