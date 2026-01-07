const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../model/UserModel");

exports.signup = async (req, res) => {
  try {
    const { email, phone, username, password, full_name } = req.body;

    // findUserByEmail now returns the user object or undefined
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

    res.json({ msg: "Signup successful", user: newUser });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // findUserByEmail now returns the user object or undefined
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user info (excluding password_hash)
    const { password_hash, ...userInfo } = user;

    res.json({ msg: "Signin successful", token, user: userInfo });
  } catch (e) {
    console.error("Signin error:", e);
    res.status(500).json({ error: e.message });
  }
};
