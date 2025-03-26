const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'way_finder'
});

connection.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    throw err;
  }
  console.log("Connected to database");
});

module.exports = connection;
