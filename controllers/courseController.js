const db = require("../config/db"); // assuming this exports a 'pg' Pool

exports.uploadCourse = async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Parse the "course" JSON sent from frontend
    // -------------------------------------------------
    if (!req.body.course)
      return res.status(400).json({ error: "course object missing" });

    let courseData;
    try {
      courseData = JSON.parse(req.body.course);
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON in 'course'" });
    }

    const { title, description, level, language, is_free, price, chapters } =
      courseData;

    // -------------------------------------------------
    // 2. Validation
    // -------------------------------------------------
    if (!title || !description || !level || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(chapters)) {
      return res.status(400).json({ error: "chapters must be an array" });
    }

    // -------------------------------------------------
    // 3. Thumbnail (binary)
    // -------------------------------------------------
    const thumbnail = req.files?.find((f) => f.fieldname === "thumbnail");
    if (!thumbnail)
      return res.status(400).json({ error: "Thumbnail is required" });

    const thumbnail_url = thumbnail.filename;

    // -------------------------------------------------
    // 4. Attach chapter video files
    // -------------------------------------------------
    const finalChapters = chapters.map((chapter, idx) => {
      const video = req.files?.find(
        (f) => f.fieldname === `chapter_video_${idx}`
      );

      return {
        ...chapter,
        content: video ? video.filename : chapter.content,
      };
    });

    const chapters_json = JSON.stringify(finalChapters);

    // -------------------------------------------------
    // 5. DB Save using PostgreSQL function
    // -------------------------------------------------
    const pool = await db.connectDB(); // pg Pool
    const query = `
      SELECT sp_upload_course(
        $1::TEXT,
        $2::TEXT,
        $3::TEXT,
        $4::TEXT,
        $5::TEXT,
        $6::BOOLEAN,
        $7::NUMERIC,
        $8::BIGINT,
        $9::JSONB
      ) AS course_id
    `;
    const values = [
      title,
      description,
      thumbnail_url,
      level,
      language,
      is_free || false,
      is_free ? 0 : price,
      req.user_id,
      chapters_json,
    ];

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      course_id: result.rows[0].course_id,
      message: "Course uploaded successfully",
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const pool = await db.connectDB(); // pg Pool
    const query = `SELECT sp_get_course(NULL) AS result`; // NULL means "get all courses"

    const result = await pool.query(query);

    res.json({
      success: true,
      courses: result.rows[0].result || [], // JSON array of courses
    });
  } catch (err) {
    console.error("Get Courses Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ...existing code...

exports.getCourseById = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid course ID" });
    }

    const pool = await db.connectDB(); // pg Pool
    const query = `SELECT sp_get_course($1) AS result`;
    const values = [courseId];

    const result = await pool.query(query, values);
    const data = result.rows[0].result;

    if (!data || !data.course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    res.json({
      success: true,
      course: data.course,
      chapters: data.chapters || [],
    });
  } catch (err) {
    console.error("Get Course By ID Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ...existing code...
