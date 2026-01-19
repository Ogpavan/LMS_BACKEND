const db = require("../config/db");

exports.getPaidEnrollments = async (req, res) => {
  try {
    const pool = await db.connectDB();

    const query = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.is_approved,
        COALESCE(
          json_agg(
            json_build_object(
              'enrollment_id', uc.id,
              'course_id', mc.id,
              'course_title', mc.title,
              'payment_status', uc.payment_status,
              'payment_mode', uc.payment_mode,
              'enrolled_at', uc.created_at
            )
          ) FILTER (WHERE uc.id IS NOT NULL),
          '[]'
        ) AS courses
      FROM users u
      LEFT JOIN user_courses uc 
        ON u.user_id = uc.user_id 
        AND uc.is_active = TRUE
      LEFT JOIN master_courses mc 
        ON uc.course_id = mc.id
      WHERE u.role_id = 3
        AND u.is_deleted = FALSE
      GROUP BY u.user_id
      ORDER BY u.created_at DESC;
    `;

    const { rows } = await pool.query(query);

    res.json({
      success: true,
      total_students: rows.length,
      students: rows,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};
