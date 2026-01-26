const db = require("../config/db");
const bcrypt = require("bcrypt");

const { sendPasswordEmail } = require("../config/mail");
const crypto = require("crypto");

/**
 * Create a new enrollment
 * Creates a user if not exists, then enrolls in a course
 */

function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

exports.createEnrollment = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      college_name,
      batch_year,
      semester,
      course_id,
      payment_mode,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !phone ||
      !college_name ||
      !batch_year ||
      !semester ||
      !course_id ||
      !payment_mode
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const pool = await db.connectDB();

    // 1️⃣ Check if user exists
    let userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_deleted = false",
      [email],
    );
    let user = userResult.rows[0];

    if (!user) {
      // 2️⃣ Insert new user
      const insertUserQuery = `
        INSERT INTO users
          (full_name, email, phone, college_name, batch_year, semester, role_id, is_active, is_approved, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,3,TRUE,FALSE,NOW(),NOW())
        RETURNING *
      `;
      const userValues = [
        full_name,
        email,
        phone,
        college_name,
        batch_year,
        semester,
      ];
      const insertedUser = await pool.query(insertUserQuery, userValues);
      user = insertedUser.rows[0];
    }

    // 3️⃣ Insert enrollment
    const insertEnrollmentQuery = `
      INSERT INTO user_courses
        (user_id, course_id, payment_mode, payment_status, enrollment_status, created_at, updated_at, is_active)
      VALUES
        ($1,$2,$3,'pending','confirmed',NOW(),NOW(),TRUE)
      RETURNING id
    `;
    const enrollmentValues = [user.user_id, course_id, payment_mode];
    const enrollmentResult = await pool.query(
      insertEnrollmentQuery,
      enrollmentValues,
    );

    res.status(201).json({
      success: true,
      user_id: user.user_id,
      enrollment_id: enrollmentResult.rows[0].id,
    });
  } catch (err) {
    console.error("Error creating enrollment:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

/**
 * Mark an enrollment as paid
 * Updates payment status and Razorpay info in user_courses
 */
exports.markPaid = async (req, res) => {
  try {
    const {
      enrollmentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ error: "enrollmentId required" });
    }

    const pool = await db.connectDB();

    // 1️⃣ Update enrollment with payment details
    const updateEnrollmentQuery = `
      UPDATE user_courses
      SET payment_status = 'paid',
          razorpay_payment_id = $1,
          razorpay_order_id = $2,
          razorpay_signature = $3,
          enrollment_status = 'confirmed',
          updated_at = NOW()
      WHERE id = $4
      RETURNING user_id
    `;

    const enrollmentResult = await pool.query(updateEnrollmentQuery, [
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      enrollmentId,
    ]);

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const userId = enrollmentResult.rows[0].user_id;

    // 2️⃣ Fetch user info
    const userResult = await pool.query(
      "SELECT email, full_name FROM users WHERE user_id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { email, full_name } = userResult.rows[0];

    // 3️⃣ Generate new password and hash it
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update user password AND auto-approve user
    await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          is_approved = TRUE,
          updated_at = NOW()
      WHERE user_id = $2
      `,
      [hashedPassword, userId],
    );

    // 5️⃣ Send password email
    await sendPasswordEmail(email, full_name, newPassword);

    res.json({
      success: true,
      message:
        "Payment confirmed, user auto-approved, password generated and emailed",
    });
  } catch (err) {
    console.error("Error marking enrollment as paid:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
