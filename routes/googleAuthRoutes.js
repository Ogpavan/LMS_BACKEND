const express = require("express");
const router = express.Router();
const oauth2Client = require("../config/googleAuth");

router.get("/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state: req.session.id, // CSRF protection
  });

  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // IMPORTANT
    oauth2Client.setCredentials(tokens);

    req.session.googleTokens = tokens;

    res.redirect("https://app.skillspardha.com/dashboard/CreateClass");
  } catch (err) {
    console.error("Google OAuth Error:", err);
    res.status(500).send("Failed to authenticate with Google");
  }
});

module.exports = router;
