const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  createUser,
  approveUser,
  unapproveUser,
} = require("../model/UserModel");

/**
 * User signup
 */
exports.signup = async (req, res) => {
  try {
    const { email, phone, username, password, full_name } = req.body;

    // Check if email already exists
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      email,
      phone: phone || null,
      username,
      password_hash,
      full_name,
    });

    res.status(201).json({
      msg: "Signup successful. Await admin approval.",
      user: newUser,
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * User signin
 */
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user)
      return res.status(400).json({ msg: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Check if user is approved
    if (!user.is_approved) {
      return res.status(403).json({ msg: "Account not approved yet" });
    }

    // Optional: check if account is active
    if (!user.is_active) {
      return res.status(403).json({ msg: "Account is inactive" });
    }

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password_hash, ...userInfo } = user;

    res.status(200).json({ msg: "Signin successful", token, user: userInfo });
  } catch (e) {
    console.error("Signin error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Admin approves/verifies a user
 * POST /users/:id/approve
 */
exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await approveUser(id);
    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res
      .status(200)
      .json({ msg: "User approved successfully", user: updatedUser });
  } catch (e) {
    console.error("Error approving user:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Admin unapproves a user
 * POST /users/:id/unapprove
 */
exports.unapproveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await unapproveUser(id);
    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res
      .status(200)
      .json({ msg: "User set to pending successfully", user: updatedUser });
  } catch (e) {
    console.error("Error unapproving user:", e);
    res.status(500).json({ error: e.message });
  }
};
