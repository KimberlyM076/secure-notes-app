const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const os = require("os");
const Note = require("./models/Notes");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });

const app = express();
const WEB_ROOT = path.join(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.static(WEB_ROOT));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

function getLocalNetworkUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  for (const values of Object.values(interfaces)) {
    if (!Array.isArray(values)) continue;

    for (const details of values) {
      const isIPv4 = details.family === "IPv4" || details.family === 4;
      if (!isIPv4 || details.internal) continue;
      urls.push(`http://${details.address}:${port}`);
    }
  }

  return [...new Set(urls)];
}

mongoose.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    const lanUrls = getLocalNetworkUrls(PORT);
    if (lanUrls.length) {
      console.log("LAN URLs for mobile testing:");
      lanUrls.forEach((url) => console.log(`- ${url}`));
    }
    });

})
.catch(err => {
    console.error("MongoDB connection failed:", err);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(WEB_ROOT, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(WEB_ROOT, "login.html"));
});

app.get("/signup", (req, res) => {
  res.redirect("/index.html?action=signup");
});

app.get("/auth-config", (req, res) => {
  const {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_REDIRECT_URI,
    AUTH0_LOGOUT_REDIRECT_URI
  } = process.env;

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      message: "Missing AUTH0_DOMAIN or AUTH0_CLIENT_ID"
    });
  }

  res.json({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    redirectUri: AUTH0_REDIRECT_URI || `${req.protocol}://${req.get("host")}/auth/callback`,
    logoutRedirectUri: AUTH0_LOGOUT_REDIRECT_URI || `${req.protocol}://${req.get("host")}`
  });
});

// Auth0 callback endpoints forward code/state params to notes page.
app.get(["/auth/callback", "/js/callback"], (req, res) => {
  const queryIndex = req.originalUrl.indexOf("?");
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
  res.redirect(`/notes.html${query}`);
});

// Save note to database
app.post("/notes", async (req, res) => {
  console.log("NOTE ROUTE HIT", req.body);

  try {

    const { title, content, userId } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({ success: false, message: "userId, title, and content are required" });
    }

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

app.patch("/notes/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, userId } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({ success: false, message: "userId, title, and content are required" });
    }

    const updated = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { title, content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.json({ success: true, note: updated });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ success: false });
  }
});

app.put("/notes/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, userId } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({ success: false, message: "userId, title, and content are required" });
    }

    const updated = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { title, content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.json({ success: true, note: updated });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ success: false });
  }
});

//API route to get notes from the database
app.get("/notes", async (req, res) => {

  try {

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const removed = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!removed) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ success: false });
  }
});
