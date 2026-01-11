const Razorpay = require("razorpay");
const db = require("../config/db");

require("dotenv").config();

console.log(
  "Loaded Razorpay KEY_ID:",
  JSON.stringify(process.env.RAZORPAY_KEY_ID)
);
console.log(
  "Loaded Razorpay KEY_SECRET:",
  JSON.stringify(process.env.RAZORPAY_KEY_SECRET)
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { enrollmentId } = req.body;
    console.log("Received enrollmentId:", enrollmentId);

    if (!enrollmentId) {
      console.error("enrollmentId missing in request body");
      return res.status(400).json({ error: "enrollmentId required" });
    }

    const pool = await db.connectDB();

    // Get course_id from enrollment
    const enrollRes = await pool.query(
      "SELECT course_id FROM student_enrollments WHERE id = $1",
      [enrollmentId]
    );
    console.log("Enrollment query result:", enrollRes.rows);

    if (enrollRes.rows.length === 0) {
      console.error("Enrollment not found for id:", enrollmentId);
      return res.status(404).json({ error: "Enrollment not found" });
    }
    const courseId = enrollRes.rows[0].course_id;

    // Get price from course table
    const courseRes = await pool.query(
      "SELECT price FROM display_courses WHERE id = $1",
      [courseId]
    );
    console.log("Course query result:", courseRes.rows);

    if (courseRes.rows.length === 0) {
      console.error("Course not found for id:", courseId);
      return res.status(404).json({ error: "Course not found" });
    }
    const amount = courseRes.rows[0].price;

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${enrollmentId}`,
    };

    console.log("Creating Razorpay order with options:", options);
    console.log("Razorpay instance:", razorpay);

    try {
      const order = await razorpay.orders.create(options);
      console.log("Razorpay order created:", order);

      // Optionally, store order_id in DB for later verification
      await pool.query(
        "UPDATE student_enrollments SET razorpay_order_id = $1 WHERE id = $2",
        [order.id, enrollmentId]
      );

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (rzpErr) {
      console.error("Error from Razorpay API:", rzpErr);
      return res
        .status(500)
        .json({ error: "Razorpay API error", details: rzpErr });
    }
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Server error", details: err });
  }
};
