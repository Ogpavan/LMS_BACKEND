const express = require("express");
const router = express.Router();
const { handleContactUs } = require("../controllers/contactUsController");

router.post("/", handleContactUs);

module.exports = router;
