const express = require("express");
const router = express.Router();
const { getMenu } = require("../controllers/menuController");

router.get("/:roleId", getMenu);

module.exports = router;
