const db = require("../config/db");

/**
 * ✅ CREATE category
 * POST /categories
 * body: { name, slug }
 */
exports.createCategory = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    const query = `
      INSERT INTO course_categories (name, slug)
      VALUES ($1, $2)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [name, slug]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * ✅ READ all categories
 * GET /categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const pool = await db.connectDB();

    const query = `
      SELECT id, name, slug, created_at
      FROM course_categories
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * ✅ READ single category by ID
 * GET /categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;

    const query = `
      SELECT id, name, slug, created_at
      FROM course_categories
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ error: "Server error" });
  }
};


/**
 * ✅ UPDATE category
 * PUT /categories/:id
 * body: { name, slug }
 */
exports.updateCategory = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;
    const { name, slug } = req.body;

    const query = `
      UPDATE course_categories
      SET name = $1,
          slug = $2
      WHERE id = $3
      RETURNING *
    `;

    const { rows } = await pool.query(query, [name, slug, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "Server error" });
  }
};
/**
 * ✅ DELETE category
 * DELETE /categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const pool = await db.connectDB();
    const { id } = req.params;

    const query = `
      DELETE FROM course_categories
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Server error" });
  }
};
