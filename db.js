const mysql = require("mysql2/promise");
process.loadEnvFile();
const express = require("express");
const app = express();
const cors = require("cors");

// Adds headers: Access-Control-Allow-Origin: *
app.use(cors());

app.use(express.urlencoded({ extended: true })); // for HTML form

app.use(express.json()); // for JSON bodies (e.g., from Postman)

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function testConnection() {
  try {
    await connection.query("SELECT 1");
    console.log("Connected to MySQL database");
  } catch (err) {
    console.log("Database connection failed:", err.message);
  }
}
testConnection();//test the database connection

app.get("/", (req, res) => {
  res.send("Hello World");
});

// app.get("/users", async (req, res) => {
//   try {
//     const [rows] = await connection.query("SELECT * FROM users");
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>
  console.log(`Server running on: http://localhost:${PORT}`),
);