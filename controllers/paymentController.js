const Razorpay = require("razorpay");
const db = require("../config/db");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId)
      return res.status(400).json({ error: "enrollmentId required" });

    const pool = await db.connectDB();

    // 1️⃣ Get enrollment info
    const enrollmentRes = await pool.query(
      "SELECT course_id FROM user_courses WHERE id = $1",
      [enrollmentId],
    );

    if (enrollmentRes.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const courseId = enrollmentRes.rows[0].course_id;

    // 2️⃣ Get course price
    const courseRes = await pool.query(
      "SELECT price FROM master_courses WHERE id = $1",
      [courseId],
    );

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const amount = courseRes.rows[0].price;

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_${enrollmentId}`,
    };

    // 3️⃣ Create Razorpay order
    const order = await razorpay.orders.create(options);

    // 4️⃣ Store Razorpay order id in user_courses
    await pool.query(
      "UPDATE user_courses SET razorpay_order_id = $1, updated_at = NOW() WHERE id = $2",
      [order.id, enrollmentId],
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};





// 