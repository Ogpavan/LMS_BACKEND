const bcrypt = require("bcryptjs");
const pool = require("../config/db"); // your PostgreSQL pool

/**
 * Create a new user (student/instructor)
 * role_id: 2 = instructor, 3 = student
 */
exports.createUser = async (req, res) => {
  try {
    const { email, phone, password, full_name, role_id } = req.body;

    if (!email || !password || !full_name || !role_id) {
      return res.status(400).json({
        error: "Name, email, password, and role_id are required",
      });
    }

    // Check if email already exists
    const existing = await pool.query(
      "SELECT user_id FROM users WHERE email = $1 AND is_deleted = false",
      [email],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users
        (email, phone, password_hash, full_name, role_id, is_active, is_email_verified, is_phone_verified, failed_attempts, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, true, false, false, 0, NOW(), NOW())
      RETURNING user_id, email, phone, full_name, role_id, is_active`,
      [email, phone || null, password_hash, full_name, role_id],
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};

/**
 * Get all users by role
 * role_id: 2 = instructor, 3 = student
 */
exports.getUsersByRole = async (req, res) => {
  try {
    const { role_id } = req.params;

    const result = await pool.query(
      `SELECT user_id, full_name, email, phone, is_active, created_at
       FROM users
       WHERE role_id = $1 AND is_deleted = false
       ORDER BY created_at DESC`,
      [role_id],
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Update user details
 */
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { email, phone, full_name, role_id, is_active } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           full_name = COALESCE($4, full_name),
           role_id = COALESCE($5, role_id),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE user_id = $1 AND is_deleted = false
       RETURNING user_id, email, phone, full_name, role_id, is_active`,
      [user_id, email, phone, full_name, role_id, is_active],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * Update only user status (is_active)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_active } = req.body;

    if (!user_id || typeof is_active === "undefined") {
      return res
        .status(400)
        .json({ error: "user_id and is_active are required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = $2,
           updated_at = NOW()
       WHERE user_id = $1 AND is_deleted = false
       RETURNING user_id, email, full_name, is_active`,
      [user_id, is_active],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User status updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

/**
 * Soft delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_deleted = true,
           updated_at = NOW()
       WHERE user_id = $1 AND is_deleted = false
       RETURNING user_id, full_name, email`,
      [user_id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "User not found or already deleted" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
