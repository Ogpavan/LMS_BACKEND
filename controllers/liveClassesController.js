// Suspend a live class by id
exports.suspendLiveClass = async (req, res) => {
  const classId = req.params.id;
  if (!classId) {
    return res.status(400).json({ message: "Missing class id" });
  }
  try {
    const pool = await connectDB();
    // PostgreSQL: Use $1 for parameter, NOW() for current timestamp, RETURNING * for output
    const result = await pool.query(
      `UPDATE live_classes
        SET is_suspended = true, status = 'suspended', updated_at = NOW()
        WHERE id = $1
        RETURNING *;`,
      [classId]
    );
    if (result.rows && result.rows[0]) {
      res.json({ success: true, liveClass: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "Class not found" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to suspend class" });
  }
};
// Get all live classes for a specific instructor
exports.getInstructorLiveClasses = async (req, res) => {
  const teacherId = req.query.teacher_id;
  if (!teacherId) {
    return res.status(400).json({ message: "Missing teacher_id" });
  }
  try {
    const pool = await connectDB();
    const result = await pool.query(
      `SELECT
          lc.id,
          lc.title,
          lc.description,
          lc.meet_link,
          lc.start_time,
          lc.end_time,
          lc.status,
          lc.is_suspended,
          lc.course_id,
          c.title AS course_title,
          lc.chapter_id,
          ch.title AS chapter_title,
          lc.teacher_id,
          u.full_name AS instructor
        FROM live_classes lc
        LEFT JOIN courses c ON lc.course_id = c.course_id
        LEFT JOIN course_chapters ch ON lc.chapter_id = ch.chapter_id
        LEFT JOIN users u ON lc.teacher_id = u.user_id
        WHERE lc.teacher_id = $1 AND (lc.status IS NULL OR lc.status != 'cancelled')
        ORDER BY lc.start_time DESC`,
      [teacherId]
    );
    res.json({ liveClasses: result.rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch instructor's live classes" });
  }
};
// Get all upcoming live classes for students
exports.getAllLiveClasses = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.query(`
      SELECT
        lc.id,
        lc.title,
        lc.description,
        lc.meet_link,
        lc.start_time,
        lc.end_time,
        lc.status,
        lc.course_id,
        c.title AS course_title,
        lc.chapter_id,
        ch.title AS chapter_title,
        lc.teacher_id,
        u.full_name AS instructor
      FROM live_classes lc
      LEFT JOIN courses c ON lc.course_id = c.course_id
      LEFT JOIN course_chapters ch ON lc.chapter_id = ch.chapter_id
      LEFT JOIN users u ON lc.teacher_id = u.user_id
      WHERE lc.status IS NULL OR lc.status != 'cancelled'
      ORDER BY lc.start_time DESC
    `);
    res.json({ liveClasses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch live classes" });
  }
};
// Get all courses with chapters for dropdowns
exports.getCoursesWithChapters = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.query(`
      SELECT 
        c.course_id,
        c.title AS course_title,
        ch.chapter_id,
        ch.title AS chapter_title
      FROM courses c
      LEFT JOIN course_chapters ch
        ON c.course_id = ch.course_id AND ch.is_deleted = false
      WHERE c.is_deleted = false
      ORDER BY c.title, ch.sort_order
    `);

    // Transform flat recordset into nested structure
    const coursesMap = {};
    result.rows.forEach((row) => {
      if (!coursesMap[row.course_id]) {
        coursesMap[row.course_id] = {
          course_id: row.course_id,
          course_title: row.course_title,
          chapters: [],
        };
      }
      if (row.chapter_id) {
        coursesMap[row.course_id].chapters.push({
          chapter_id: row.chapter_id,
          chapter_title: row.chapter_title,
        });
      }
    });

    const courses = Object.values(coursesMap);
    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses and chapters" });
  }
};

const { google } = require("googleapis");
const oauth2Client = require("../config/googleAuth");
const { connectDB } = require("../config/db");

exports.createLiveClass = async (req, res) => {
  if (!req.session.googleTokens || !req.session.googleTokens.access_token) {
    // Always return JSON for API endpoints, never redirect
    return res.status(401).json({
      message: "Google authentication required. Please log in with Google.",
    });
  }

  try {
    const {
      course_id,
      chapter_id,
      teacher_id,
      title,
      description,
      start_time,
      end_time,
    } = req.body;

    // Tokens should already be stored per teacher
    oauth2Client.setCredentials(req.session.googleTokens);

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const event = {
      summary: title,
      description,
      start: { dateTime: start_time },
      end: { dateTime: end_time },
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;
    const calendarEventId = response.data.id;

    // Use connectDB() to get the pool
    const pool = await connectDB();
    const insertResult = await pool.query(
      `INSERT INTO live_classes
        (course_id, chapter_id, teacher_id, title, description,
         meet_link, calendar_event_id, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;`,
      [
        course_id,
        chapter_id,
        teacher_id,
        title,
        description,
        meetLink,
        calendarEventId,
        start_time,
        end_time,
      ]
    );

    // Fetch instructor name for response (if not present in inserted row)
    let instructorName = null;
    if (insertResult.rows && insertResult.rows[0]) {
      const inserted = insertResult.rows[0];
      if (!inserted.instructor) {
        const userRes = await pool.query(
          `SELECT full_name FROM users WHERE user_id = $1`,
          [teacher_id]
        );
        instructorName = userRes.rows[0]?.full_name || null;
      }
    }

    // Compose liveClass object for frontend
    const liveClass =
      insertResult.rows && insertResult.rows[0]
        ? {
            ...insertResult.rows[0],
            instructor: instructorName || undefined,
          }
        : null;

    res.status(201).json({
      success: true,
      message: "Live class created successfully",
      meet_link: meetLink,
      liveClass,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create live class",
    });
  }
};
