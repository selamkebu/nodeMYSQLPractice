const mysql = require("mysql2/promise");
process.loadEnvFile();
const express = require("express");
const app = express();
const cors = require("cors");//to allow your Express server to have
//access to the form URL.

const path = require("path");


// Adds headers: Access-Control-Allow-Origin: *
app.use(cors());

app.use(express.urlencoded({ extended: true })); // changes the imputs from HTML forms to object format

app.use(express.json()); // for JSON bodies (e.g., from Postman)

//create the connection pool globaly so that createTables function can access it
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

//tests connection to the MYSQL database
async function testConnection() {
   
  try {
    await pool.query("SELECT 1");
    console.log("Connected to MySQL database");
  } catch (err) {
    console.log("Database connection failed:", err.message);
  }
}


//Creates the tables
// No inner try/catch: if any statement fails, the error reaches the route
//if you are calling the function without using the route you have to put the try catch inside it

const tableQueries = [
  `CREATE TABLE IF NOT EXISTS products_table (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_url VARCHAR(255)
  )`,

  `CREATE TABLE IF NOT EXISTS product_description_table (
    description_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    product_brief_description TEXT,
    product_description TEXT,
    product_img VARCHAR(255),
    product_link VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products_table(product_id)
  )`,

  `CREATE TABLE IF NOT EXISTS product_price_table (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    starting_price DECIMAL(12, 2) NOT NULL,
    price_range VARCHAR(100),
    FOREIGN KEY (product_id) REFERENCES products_table(product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS users_table (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS orders_table (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products_table(product_id),
    FOREIGN KEY (user_id) REFERENCES users_table(user_id)
  )`,
];

async function createTables() {
  
    for (const query of tableQueries) 
      {
      await pool.query(query);
      console.log("Table ready.");
    }
  }

testConnection();//TEST the database connection

// createTables();//CREATE tables

//TEST the server connection
// app.get("/", (req, res) => {
//   res.send("Hello World");
// });
//loads the index page
app.get(["/", "/add_product"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


//this route crates the tables
app.get("/install", async (req, res) => {
    try{
   await createTables();
   console.log("the tables created successfully");
  res.send("tables created");
    }
    catch(err){
        console.log("Failed to create the tables", err.message);
        res.status(500).send("Failed to create the company table.");

    }
});

//the route to add the form data recived into the database
app.post("/add-product", async (req, res) => {
   const {
     product_name,
     product_url,
     product_brief_description,
     product_description,
     product_img,
     product_link,
     starting_price,
     price_range,
     user_name,
     user_password,
   } = req.body;

   if (!product_name || !starting_price || !user_name || !user_password) {
     return res
       .status(400)
       .send(
         "Product name, starting price, username, and password are required.",
       );
   }

  try {
    // 1. product_table
    const [result] = await pool.query(
      "INSERT INTO products_table (product_name, product_url) VALUES (?, ?)",
      [product_name, product_url || null],
    );
    const productId = result.insertId;

    // 2. product_description_table
    await pool.query(
      `INSERT INTO product_description_table
        (product_id, product_brief_description, product_description, product_img, product_link)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productId,
        product_brief_description || null,
        product_description || null,
        product_img || null,
        product_link || null,
      ],
    );
    
    // 3. product_price_table
    await pool.query(
      "INSERT INTO product_price_table (product_id, starting_price, price_range) VALUES (?, ?, ?)",
      [productId, starting_price, price_range || null],
    );

    // 3. user_table
    const [userResult] = await pool.query(
      "INSERT INTO users_table (user_name, user_password) VALUES (?, ?)",
      [user_name, user_password], // plain text for now — see the hashing note below
    );
    const userId = userResult.insertId;

    // 3. order_table
    await pool.query(
      "INSERT INTO orders_table (product_id, user_id) VALUES (?, ?)",
      [productId, userId],
    );

    console.log("product saved");
    res.send(`Product saved`);
  } catch (err) {
    console.log("Failed to save product:", err.message);
    res.status(500).send("Failed to save the product: " + err.message);
  }
});



const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>
  console.log(`Server running on: http://localhost:${PORT}`),
);