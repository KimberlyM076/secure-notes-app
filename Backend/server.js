require("dotenv").config();
console.log(process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// Test route
app.get("/", (req, res) => {
  res.send("Lotus Notes API Running");
});

// User schema
const UserSchema = new mongoose.Schema({
  password: String
});

const User = mongoose.model("User", UserSchema);

// Signup
app.post("/signup", async (req, res) => {

  const { password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    password: hashedPassword
  });

  await user.save();

  res.json({ success: true });

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});