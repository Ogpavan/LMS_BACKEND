const { google } = require("googleapis");
const oauth2Client = require("../config/googleAuth");
const { connectDB } = require("../config/db");

/* ======================================================
   Suspend a live class by ID
====================================================== */
exports.suspendLiveClass = async (req, res) => {
  const classId = req.params.id;

  if (!classId) {
    return res.status(400).json({ message: "Missing class id" });
  }

  try {
    const pool = await connectDB();

    const result = await pool.query(
      `UPDATE live_classes
       SET is_suspended = TRUE,
           status = 'suspended',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [classId],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    res.json({
      success: true,
      liveClass: result.rows[0],
    });
  } catch (error) {
    console.error("Suspend live class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to suspend live class",
    });
  }
};

/* ======================================================
   Get all live classes for a specific instructor
====================================================== */
exports.getInstructorLiveClasses = async (req, res) => {
  const { teacher_id } = req.query;

  if (!teacher_id) {
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
      WHERE lc.teacher_id = $1
        AND (lc.status IS NULL OR lc.status <> 'cancelled')
      ORDER BY lc.start_time DESC;`,
      [teacher_id],
    );

    res.json({ liveClasses: result.rows });
  } catch (error) {
    console.error("Fetch instructor live classes error:", error);
    res.status(500).json({
      message: "Failed to fetch instructor live classes",
    });
  }
};

/* ======================================================
   Get all upcoming live classes (students)
====================================================== */
exports.getAllLiveClasses = async (req, res) => {
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
      WHERE lc.status IS NULL OR lc.status <> 'cancelled'
      ORDER BY lc.start_time DESC;`,
    );

    res.json({ liveClasses: result.rows });
  } catch (error) {
    console.error("Fetch all live classes error:", error);
    res.status(500).json({
      message: "Failed to fetch live classes",
    });
  }
};

/* ======================================================
   Get courses with chapters (dropdown)
====================================================== */
exports.getCoursesDropdown = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.query(
      `SELECT id, title
       FROM master_courses
       WHERE is_active = TRUE AND is_deleted = FALSE
       ORDER BY title;`,
    );

    res.json({
      courses: result.rows,
    });
  } catch (error) {
    console.error("Fetch courses dropdown error:", error);
    res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
};

/* ======================================================
   Create live class (Google Meet + DB)
====================================================== */
exports.createLiveClass = async (req, res) => {
  if (!req.session.googleTokens?.access_token) {
    return res.status(401).json({
      message: "Google authentication required",
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

    const calendarResponse = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = calendarResponse.data.hangoutLink;
    const calendarEventId = calendarResponse.data.id;

    const pool = await connectDB();

    const insertResult = await pool.query(
      `INSERT INTO live_classes
       (course_id, chapter_id, teacher_id, title, description,
        meet_link, calendar_event_id, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
      ],
    );

    const liveClass = insertResult.rows[0];

    const instructorRes = await pool.query(
      `SELECT full_name FROM users WHERE user_id = $1`,
      [teacher_id],
    );

    res.status(201).json({
      success: true,
      message: "Live class created successfully",
      liveClass: {
        ...liveClass,
        instructor: instructorRes.rows[0]?.full_name || null,
      },
    });
  } catch (error) {
    console.error("Create live class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create live class",
    });
  }
};

/* ======================================================
   Get all live classes for a specific student
   Only for courses the student is enrolled in
====================================================== */
exports.getStudentLiveClasses = async (req, res) => {
  const userId = req.params.userId; // or req.query.userId depending on your route

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const pool = await connectDB();

    const result = await pool.query(
      `SELECT
          lc.id AS live_class_id,
          lc.course_id,
          lc.chapter_id,
          lc.teacher_id,
          lc.title,
          lc.description,
          lc.meet_link,
          lc.start_time,
          lc.end_time,
          lc.status,
          lc.is_active,
          lc.is_visible_to_students,
          mc.title AS course_title,
          u.full_name AS instructor
       FROM live_classes lc
       JOIN user_courses uc ON uc.course_id = lc.course_id
       JOIN master_courses mc ON mc.id = lc.course_id
       LEFT JOIN users u ON u.user_id = lc.teacher_id
       WHERE uc.user_id = $1
         AND uc.payment_status = 'paid'
         AND uc.is_active = TRUE
         AND mc.is_deleted = FALSE
         AND lc.is_active = TRUE
         AND lc.is_visible_to_students = TRUE
       ORDER BY lc.start_time DESC;`,
      [userId],
    );

    res.json({
      success: true,
      liveClasses: result.rows,
    });
  } catch (error) {
    console.error("Fetch student live classes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live classes for student",
    });
  }
};

/* ======================================================
   Cancel live class (DELETE Google Meet + Calendar event)
====================================================== */
exports.cancelLiveClass = async (req, res) => {
  const classId = req.params.id;

  if (!req.session.googleTokens?.access_token) {
    return res.status(401).json({ message: "Google auth required" });
  }

  try {
    const pool = await connectDB();

    // Fetch calendar_event_id
    const { rows } = await pool.query(
      `SELECT calendar_event_id
       FROM live_classes
       WHERE id = $1`,
      [classId],
    );

    if (!rows.length || !rows[0].calendar_event_id) {
      return res.status(404).json({
        success: false,
        message: "Live class or calendar event not found",
      });
    }

    const calendarEventId = rows[0].calendar_event_id;

    // Set Google credentials
    oauth2Client.setCredentials(req.session.googleTokens);

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    // 🔥 DELETE calendar event (kills Meet link)
    await calendar.events.delete({
      calendarId: "primary",
      eventId: calendarEventId,
    });

    // Update DB status
    await pool.query(
      `UPDATE live_classes
       SET status = 'cancelled',
           is_active = FALSE,
           meet_link = NULL,
           calendar_event_id = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [classId],
    );

    res.json({
      success: true,
      message: "Live class cancelled and Meet link deactivated",
    });
  } catch (error) {
    console.error("Cancel live class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel live class",
    });
  }
};
  