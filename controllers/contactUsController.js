const validator = require("validator");
const { Pool } = require("pg");

// Configure your PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or use individual env vars
  // ssl: { rejectUnauthorized: false }, // Uncomment if using SSL (e.g., on Heroku)
});

exports.handleContactUs = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (
      !name ||
      !email ||
      !subject ||
      !message ||
      !validator.isEmail(email) ||
      name.length > 100 ||
      subject.length > 150 ||
      message.length > 2000
    ) {
      return res.status(400).json({ error: "Invalid input." });
    }

    // Sanitize input
    const safeName = validator.escape(name.trim());
    const safeEmail = validator.normalizeEmail(email.trim());
    const safeSubject = validator.escape(subject.trim());
    const safeMessage = validator.escape(message.trim());

    // Insert into DB
    const query = `
      INSERT INTO contact_us (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `;
    const values = [safeName, safeEmail, safeSubject, safeMessage];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: "Your message has been received.",
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("Contact Us Error:", err);
    res.status(500).json({ error: "Server error." });
  }
};
