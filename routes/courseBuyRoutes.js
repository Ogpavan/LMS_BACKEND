const express = require("express");
const router = express.Router();
const courseBuy = require("../controllers/courseBuy");

router.post("/", courseBuy.createEnrollment);
router.post("/mark-paid", courseBuy.markPaid);

module.exports = router;
