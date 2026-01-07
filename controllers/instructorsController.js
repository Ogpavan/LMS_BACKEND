const { sql, connectDB } = require("../config/db");
const bcrypt = require("bcryptjs"); // npm install bcryptjs

exports.getStudents = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("role_id", sql.Int, 3)
      .execute("sp_GetUsersByRole");

    const students = result.recordset.map((s) => ({
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

exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { email, phone, full_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const pool = await connectDB();
    await pool
      .request()
      .input("user_id", sql.BigInt, user_id)
      .input("email", sql.NVarChar(255), email)
      .input("phone", sql.NVarChar(20), phone)
      .input("full_name", sql.NVarChar(255), full_name)
      .execute("sp_UpdateUser");

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_active } = req.body;

    if (!user_id || typeof is_active === "undefined") {
      return res
        .status(400)
        .json({ error: "user_id and is_active are required" });
    }

    const pool = await connectDB();
    await pool
      .request()
      .input("user_id", sql.BigInt, user_id)
      .input("is_active", sql.Bit, is_active)
      .execute("sp_UpdateUser");

    res.json({ success: true, message: "User status updated successfully" });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const pool = await connectDB();
    const result = await pool
      .request()
      .input("user_id", sql.BigInt, user_id)
      .execute("sp_DeleteUser");

    const response = result.recordset && result.recordset[0];
    if (response && response.success) {
      res.json({ success: true, message: response.message });
    } else {
      res.status(404).json({ error: "User not found or already deleted." });
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, phone, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), email)
      .input("phone", sql.NVarChar(20), phone)
      .input("password_hash", sql.NVarChar(255), password_hash)
      .input("full_name", sql.NVarChar(255), full_name)
      .input("role_id", sql.Int, 3) // 2 = Student
      .execute("sp_CreateUser");

    const user =
      result.recordset && result.recordset[0]
        ? {
            user_id: result.recordset[0].user_id,
            full_name,
            email,
            phone,
            is_active: 1,
          }
        : null;

    res.json({ success: true, user, message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};
