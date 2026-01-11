const db = require("../config/db"); // use the same db module as courseController

exports.getCoursesByCategory = async (req, res) => {
  try {
    const pool = await db.connectDB(); // get the pg Pool

    // 1️⃣ Fetch all courses with their category and tags
    const query = `
  SELECT 
    c.id AS course_id,
    c.course_code,
    c.title,
    c.description,
    c.duration,
    c.level,
    c.price,
    c.image_url,
    cat.name AS category_name
  FROM display_courses c
  JOIN course_categories cat ON c.category_id = cat.id
  WHERE c.is_active = TRUE
  ORDER BY cat.name, c.id;
`;

    const { rows } = await pool.query(query);

    // 2️⃣ Transform rows into { category: [courses] } format
    const result = {};

    rows.forEach((row) => {
      const category = row.category_name;

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push({
        id: row.course_id, // numeric unique ID
        duration: row.duration,
        level: row.level,
        title: row.title,
        description: row.description,
        price: `₹${row.price.toLocaleString("en-IN")}`, // ₹5,399 formatting
        image: row.image_url,
        tags: [],
      });
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ...existing code...

exports.getDisplayCourseDetails = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const courseId = req.params.id;

    const query = `
      SELECT *
      FROM display_course_details
      WHERE course_id = $1
    `;
    const { rows } = await pool.query(query, [courseId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching course details:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// ...existing code...

exports.getCoursesNamesAndIds = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const query = `select id,title from display_courses where is_active=true`;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching course names and IDs:", err);
    res.status(500).json({ error: "Server error" });
  }
};
