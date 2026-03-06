require("dotenv").config();

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
