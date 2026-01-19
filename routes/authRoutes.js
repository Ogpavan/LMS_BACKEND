const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  verifyUser,
  unapproveUser,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/signin", signin);

// Admin verifies a user
router.post("/users/:id/approve", verifyUser);
router.post("/users/:id/unapprove", unapproveUser);

module.exports = router;
