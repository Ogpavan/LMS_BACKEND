const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const oauth2Client = require("../config/googleAuth");

router.get("/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
  res.redirect(url);
});

// --- Add this callback route ---
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.googleTokens = tokens;
    // Redirect to frontend after successful login
    res.redirect("http://localhost:5173"); // Change if your frontend URL is different
  } catch (err) {
    res.status(500).send("Failed to authenticate with Google");
  }
});

module.exports = router;
