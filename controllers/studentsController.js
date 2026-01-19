const pool = require("../config/db"); // your PostgreSQL pool
const bcrypt = require("bcryptjs");

// Get all students (role_id = 3)
exports.getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sp_get_users_by_role($1)",
      [3], // Student role_id = 3
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
// ...existing code...
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    let { email, phone, full_name, role_id, is_active, password } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // If role_id is not provided, set default to 3 (student)
    if (!role_id) {
      role_id = 3;
    }

    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `UPDATE users
       SET email = $1,
           phone = $2,
           full_name = $3,
           role_id = $4,
           is_active = $5,
           password_hash = COALESCE($6, password_hash)
       WHERE user_id = $7`,
      [email, phone, full_name, role_id, is_active, password_hash, user_id],
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};
// ...existing code...

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
      [user_id, is_active],
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
      `
      SELECT * FROM sp_create_user(
        p_email => $1,
        p_password_hash => $2,
        p_full_name => $3,
        p_role_id => $4,
        p_phone => $5
      )
      `,
      [email, password_hash, full_name, 3, phone],
    );

    const userRecord = result.rows[0];

    if (!userRecord || !userRecord.user_id) {
      return res
        .status(400)
        .json({ error: userRecord?.message || "Failed to create user" });
    }

    res.json({
      success: true,
      user: {
        user_id: userRecord.user_id,
        full_name,
        email,
        phone,
        is_active: true,
      },
      message: userRecord.message,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};
