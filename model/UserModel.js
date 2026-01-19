const { query } = require("../config/db");

// Find user by email
module.exports.findUserByEmail = async (email) => {
  const result = await query(
    "SELECT * FROM users WHERE email = $1 AND is_deleted = false",
    [email],
  );
  return result.rows[0];
};

// Create user
module.exports.createUser = async ({
  email,
  phone,
  password_hash,
  full_name,
  role_id = 3,
  is_active = true,
  is_email_verified = false,
  is_phone_verified = false,
  is_approved = false, // NEW COLUMN
  failed_attempts = 0,
  last_login = null,
  created_at = new Date(),
  updated_at = new Date(),
  deleted_at = null,
}) => {
  const result = await query(
    `INSERT INTO users (
      email, phone, password_hash, full_name, role_id,
      is_active, is_email_verified, is_phone_verified, is_approved, failed_attempts,
      last_login, created_at, updated_at, deleted_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [
      email,
      phone,
      password_hash,
      full_name,
      role_id,
      is_active,
      is_email_verified,
      is_phone_verified,
      is_approved,
      failed_attempts,
      last_login,
      created_at,
      updated_at,
      deleted_at,
    ],
  );
  return result.rows[0];
};

// Approve a user (set is_approved = true)
module.exports.approveUser = async (userId) => {
  const result = await query(
    `UPDATE users
     SET is_approved = TRUE, updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId],
  );
  return result.rows[0];
};

// ...existing code...

exports.unapproveUser = async (userId) => {
  const db = require("../config/db");
  const pool = await db.connectDB();
  const query = `
    UPDATE users
    SET is_approved = FALSE
    WHERE user_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};
