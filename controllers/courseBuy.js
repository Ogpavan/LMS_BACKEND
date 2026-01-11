const db = require("../config/db");

exports.createEnrollment = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      collegeName,
      batch,
      semester,
      courseInterested,
      paymentMode,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !collegeName ||
      !batch ||
      !semester ||
      !courseInterested ||
      !paymentMode
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const pool = await db.connectDB();
    const query = `
      INSERT INTO student_enrollments
        (name, email, phone, college_name, batch_year, semester, course_id, payment_mode)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const values = [
      name,
      email,
      phone,
      collegeName,
      batch,
      semester,
      courseInterested,
      paymentMode,
    ];

    const { rows } = await pool.query(query, values);

    res.status(201).json({ success: true, enrollmentId: rows[0].id });
  } catch (err) {
    console.error("Error creating enrollment:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const {
      enrollmentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;
    if (!enrollmentId)
      return res.status(400).json({ error: "enrollmentId required" });

    const pool = await db.connectDB();
    await pool.query(
      "UPDATE student_enrollments SET payment_status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2 WHERE id = $3",
      [razorpay_payment_id, razorpay_signature, enrollmentId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking enrollment as paid:", err);
    res.status(500).json({ error: "Server error" });
  }
};
