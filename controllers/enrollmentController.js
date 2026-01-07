const db = require("../config/db");

// Helper: map DB row to API response
function mapEnrollment(row) {
  return {
    enrollment_id: row.enrollment_id,
    student_id: row.student_id,
    course_id: row.course_id,
    enrollment_type: row.enrollment_type,
    enrollment_status: row.enrollment_status,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at,
    progress_percent: row.progress_percent,
    is_completed: !!row.is_completed,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    payment_reference: row.payment_reference,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_deleted: !!row.is_deleted,
  };
}

const EnrollmentController = {
  // Cancel an enrollment (soft cancel)
  async cancel(req, res) {
    try {
      const { id } = req.params;
      // Set enrollment_status to 'cancelled', set cancelled_at and updated_at
      await db.query(
        "UPDATE course_enrollments SET enrollment_status = ?, cancelled_at = ?, updated_at = ? WHERE enrollment_id = ? AND is_deleted = 0",
        ["cancelled", new Date(), new Date(), id]
      );
      // Return updated enrollment
      const [rows] = await db.query(
        "SELECT * FROM course_enrollments WHERE enrollment_id = ?",
        [id]
      );
      if (!rows.length)
        return res.status(404).json({ error: "Enrollment not found" });
      res.json(mapEnrollment(rows[0]));
    } catch (err) {
      res.status(500).json({ error: "Failed to cancel enrollment" });
    }
  },
  // List all enrollments (optionally filter by course or student)
  async list(req, res) {
    try {
      const { course_id, student_id } = req.query;
      let sql = "SELECT * FROM course_enrollments WHERE is_deleted = 0";
      const params = [];
      if (course_id) {
        sql += " AND course_id = ?";
        params.push(course_id);
      }
      if (student_id) {
        sql += " AND student_id = ?";
        params.push(student_id);
      }
      const [rows] = await db.query(sql, params);
      res.json({ enrollments: rows.map(mapEnrollment) });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  },

  // Get a single enrollment by ID
  async get(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query(
        "SELECT * FROM course_enrollments WHERE enrollment_id = ? AND is_deleted = 0",
        [id]
      );
      if (!rows.length)
        return res.status(404).json({ error: "Enrollment not found" });
      res.json(mapEnrollment(rows[0]));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  },

  // Enroll a student in a course
  async create(req, res) {
    try {
      const {
        student_id,
        course_id,
        enrollment_type = "self",
        payment_status = "free",
        amount_paid = null,
        payment_reference = null,
      } = req.body;
      if (!student_id || !course_id) {
        return res
          .status(400)
          .json({ error: "student_id and course_id required" });
      }
      const result = await db.query(
        `INSERT INTO course_enrollments (student_id, course_id, enrollment_type, payment_status, amount_paid, payment_reference)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          student_id,
          course_id,
          enrollment_type,
          payment_status,
          amount_paid,
          payment_reference,
        ]
      );
      // Get the inserted enrollment (MSSQL: SCOPE_IDENTITY() or get by student_id+course_id)
      let inserted;
      if (
        result &&
        result.recordset &&
        result.recordset[0] &&
        result.recordset[0].enrollment_id
      ) {
        const selectRes = await db.query(
          "SELECT * FROM course_enrollments WHERE enrollment_id = ?",
          [result.recordset[0].enrollment_id]
        );
        inserted = selectRes.recordset[0];
      } else {
        // fallback: get latest for this student/course
        const selectRes = await db.query(
          "SELECT TOP 1 * FROM course_enrollments WHERE student_id = ? AND course_id = ? ORDER BY enrolled_at DESC",
          [student_id, course_id]
        );
        inserted = selectRes.recordset[0];
      }
      res.status(201).json(mapEnrollment(inserted));
    } catch (err) {
      console.error("[ENROLLMENT][ERROR]", err);
      res
        .status(500)
        .json({ error: "Failed to enroll student", details: err.message });
    }
  },

  // Update enrollment (progress, status, etc)
  async update(req, res) {
    try {
      const { id } = req.params;
      const fields = [
        "enrollment_status",
        "progress_percent",
        "is_completed",
        "completed_at",
        "cancelled_at",
        "payment_status",
        "amount_paid",
        "payment_reference",
        "updated_at",
      ];
      const updates = [];
      const params = [];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = ?`);
          params.push(req.body[f]);
        }
      });
      if (!updates.length)
        return res.status(400).json({ error: "No fields to update" });
      params.push(new Date()); // updated_at
      updates.push("updated_at = ?");
      params.push(id);
      const sql = `UPDATE course_enrollments SET ${updates.join(
        ", "
      )} WHERE enrollment_id = ? AND is_deleted = 0`;
      await db.query(sql, params);
      const [rows] = await db.query(
        "SELECT * FROM course_enrollments WHERE enrollment_id = ?",
        [id]
      );
      res.json(mapEnrollment(rows[0]));
    } catch (err) {
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  },

  // Soft delete enrollment
  async remove(req, res) {
    try {
      const { id } = req.params;
      await db.query(
        "UPDATE course_enrollments SET is_deleted = 1, updated_at = ? WHERE enrollment_id = ?",
        [new Date(), id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete enrollment" });
    }
  },
};

module.exports = EnrollmentController;
