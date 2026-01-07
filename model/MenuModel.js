const { query } = require("../config/db");

exports.getMenuByRoleId = async (roleId) => {
  try {
    // Call your PostgreSQL function
    const result = await query("SELECT * FROM sp_getmenubyroleid($1)", [
      roleId,
    ]);

    return result.rows; // PostgreSQL returns rows instead of recordset
  } catch (err) {
    console.error("❌ Failed to get menu by roleId:", err.message);
    throw err;
  }
};
