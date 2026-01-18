/**
 * PUT /display-courses/:id
 * Update a display course
 */
exports.updateDisplayCourse = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;
    const {
      title,
      description,
      course_code,
      duration,
      level,
      image_url,
      category_id,
      price,
    } = req.body;
    if (
      !title ||
      !description ||
      !course_code ||
      !duration ||
      !level ||
      !category_id ||
      price === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const query = `
      UPDATE display_courses
      SET title = $1, description = $2, course_code = $3, duration = $4, level = $5, image_url = $6, category_id = $7, price = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING id, category_id, course_code, title, description, duration, level, price, image_url, is_active, created_at, updated_at
    `;
    const values = [
      title,
      description,
      course_code,
      duration,
      level,
      image_url,
      category_id,
      price,
      id,
    ];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Display course not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error updating display course:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * DELETE /display-courses/:id
 * Delete a display course
 */
exports.deleteDisplayCourse = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;
    const query = `DELETE FROM display_courses WHERE id = $1 RETURNING id`;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Display course not found" });
    }
    res.status(200).json({ success: true, id });
  } catch (err) {
    console.error("Error deleting display course:", err);
    res.status(500).json({ error: "Server error" });
  }
};
/**
 * POST /display-courses
 * Create a new display course
 * Expects: { title, description, duration, level, image_url, category_id }
 */
exports.createDisplayCourse = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const {
      title,
      description,
      course_code,
      duration,
      level,
      image_url,
      category_id,
      price,
    } = req.body;
    if (
      !title ||
      !description ||
      !course_code ||
      !duration ||
      !level ||
      !category_id ||
      price === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const query = `
      INSERT INTO display_courses (title, description, course_code, duration, level, image_url, category_id, price, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      RETURNING id, category_id, course_code, title, description, duration, level, price, image_url, is_active, created_at, updated_at
    `;
    const values = [
      title,
      description,
      course_code,
      duration,
      level,
      image_url,
      category_id,
      price,
    ];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating display course:", err);
    res.status(500).json({ error: "Server error" });
  }
};
/**
 * GET /display-courses
 * List all display courses (flat list)
 */
exports.getAllDisplayCourses = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const query = `
      SELECT id, category_id, course_code, title, description, duration, level, price, image_url, is_active, created_at, updated_at
      FROM display_courses
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching display courses:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /display-courses/:id
 * Get a single display course by ID
 */
exports.getDisplayCourseById = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;
    const query = `
      SELECT id, category_id, course_code, title, description, duration, level, price, image_url, is_active, created_at, updated_at
      FROM display_courses
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Display course not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching display course:", err);
    res.status(500).json({ error: "Server error" });
  }
};
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
        course_code: row.course_code,
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

/**
 * PUT /display-courses/:id/details
 * Save or update course JSON for a course
 */
exports.saveDisplayCourseJson = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;
    const { course_json } = req.body;

    if (!course_json) {
      return res.status(400).json({ error: "Missing course_json" });
    }

    // Upsert logic: update if exists, else insert
    const upsertQuery = `
      INSERT INTO display_course_details (course_id, course_json)
      VALUES ($1, $2)
      ON CONFLICT (course_id)
      DO UPDATE SET course_json = EXCLUDED.course_json
      RETURNING *;
    `;
    const { rows } = await pool.query(upsertQuery, [id, course_json]);
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error saving course JSON:", err);
    res.status(500).json({ error: "Server error" });
  }
};
