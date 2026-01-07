const { Pool } = require("pg");

// PostgreSQL configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST, // Replace with your VPS IP or domain
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  max: 10, // max pool size
  min: 0, // min pool size
  idleTimeoutMillis: 30000, // close idle clients after 30s
};

let pool;

async function connectDB() {
  try {
    if (!pool) {
      console.log("Connecting to PostgreSQL...");
      pool = new Pool(config);

      // Test the connection
      const client = await pool.connect();
      const result = await client.query(
        "SELECT current_database() AS current_db, current_user AS login_name, inet_server_addr() AS server_ip"
      );
      client.release();

      console.log("✅ Connected to PostgreSQL");
      console.log("Connection Info:", result.rows[0]);
    }
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

async function query(queryText, params = []) {
  try {
    const pool = await connectDB();
    const result = await pool.query(queryText, params);
    return result;
  } catch (err) {
    console.error("❌ Query failed:", err.message);
    throw err;
  }
}

module.exports = {
  query,
  connectDB,
  Pool,
};
