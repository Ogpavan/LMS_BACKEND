const pool = require("../config/db"); // your PostgreSQL pool
const bcrypt = require("bcryptjs");

// Get all students (role_id = 3)
exports.getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sp_get_users_by_role($1)",
      [3] // Student role_id = 3
    );

    const students = result.rows.map((s) => ({
      user_id: s.user_id,
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      is_active: s.is_active,
      created_at: s.created_at,
    }));

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { email, phone, full_name, role_id, is_active } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await pool.query(
      `CALL sp_update_user($1, $2, $3, $4, $5, $6, NULL, NULL)`,
      [user_id, email, phone, full_name, role_id, is_active]
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Update only user status (is_active)
exports.updateUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_active } = req.body;

    if (!user_id || typeof is_active === "undefined") {
      return res
        .status(400)
        .json({ error: "user_id and is_active are required" });
    }

    await pool.query(
      `CALL sp_update_user($1, NULL, NULL, NULL, NULL, $2, NULL, NULL)`,
      [user_id, is_active]
    );

    res.json({ success: true, message: "User status updated successfully" });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// Delete (soft delete) user
exports.deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const result = await pool.query("SELECT * FROM sp_delete_user($1)", [
      user_id,
    ]);

    const response = result.rows[0];
    if (response && response.success === 1) {
      res.json({ success: true, message: response.message });
    } else {
      res.status(404).json({
        error: response.message || "User not found or already deleted.",
      });
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { email, phone, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "SELECT * FROM sp_create_user($1, $2, $3, $4, $5, NULL)",
      [email, phone, password_hash, full_name, 3] // role_id = 3 for students
    );

    const userRecord = result.rows[0];

    if (!userRecord || !userRecord.user_id) {
      return res
        .status(400)
        .json({ error: userRecord.message || "Failed to create user" });
    }

    const user = {
      user_id: userRecord.user_id,
      full_name,
      email,
      phone,
      is_active: true,
    };

    res.json({ success: true, user, message: userRecord.message });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};
