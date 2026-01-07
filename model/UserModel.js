const { query } = require("../config/db");

// Find user by email
module.exports.findUserByEmail = async (email) => {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0]; // Return the first matching user
};

// Create user and return inserted row
module.exports.createUser = async ({
  email,
  phone,
  password_hash,
  full_name,
  role_id = 3, // default role
  is_active = 1,
  is_email_verified = 0,
  is_phone_verified = 0,
  failed_attempts = 0,
  last_login = null,
  created_at = new Date(),
  updated_at = new Date(),
  deleted_at = null,
}) => {
  const result = await query(
    `INSERT INTO users (
      email, phone, password_hash, full_name, role_id,
      is_active, is_email_verified, is_phone_verified, failed_attempts,
      last_login, created_at, updated_at, deleted_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, $13
    )
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
      failed_attempts,
      last_login,
      created_at,
      updated_at,
      deleted_at,
    ]
  );
  return result.rows[0]; // Return the inserted row
};
