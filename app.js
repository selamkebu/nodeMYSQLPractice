const mysql = require("mysql2/promise");
//require("dotenv").config();//uses the dotenv package, which you install with npm install dotenv. It has extra options, like loading a different file or overriding existing variables.

process.loadEnvFile();//is built into Node.js (since v20.12 / v21.7), so there's nothing to install. It reads ./.env by default, or you can pass a path: process.loadEnvFile("./config/.env").


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function main() {
  try {
    // A pool connects lazily, so borrow one connection to test the login
    const connection = await pool.getConnection();
    console.log("Connected to MySQL!");
    connection.release(); // give it back to the pool (not end())

    // Your own queries go here, for example:
    // const [rows] = await pool.query("SELECT * FROM users");
    // console.log(rows);
  } catch (err) {
    console.error("Database error:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end(); // close all pooled connections so the script can exit
    console.log("Pool closed.");
  }
}

main(); 
