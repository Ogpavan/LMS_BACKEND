const sql = require("mssql");

const config = {
  user: "lms_user",
  password: "StrongPassword123!",
  server: "VICTUS\\SQLEXPRESS",
  database: "lms_db", // create LMS database if not exists
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

let pool;
async function getPool() {
    
  try {
    if (!pool) {
      console.log("Attempting to connect to MSSQL...");
      pool = await sql.connect(config);
      console.log("MSSQL Connected");

      // Debug: Check current user and database
      const result = await pool.request().query(`
        SELECT 
          DB_NAME() AS current_db, 
          SUSER_NAME() AS login_name, 
          @@SERVERNAME AS server_name
      `);
      console.log("Connection Info:", result.recordset[0]);
    }
    return pool;
  } catch (err) {
    console.error("❌ MSSQL Connection failed:", err.message);
    throw err;
  }
}

module.exports = getPool;

getPool()
  .then(() => {
    console.log("✅ Pool acquired and debug info printed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error during pool acquisition:", err);
    process.exit(1);
  });
