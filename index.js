import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// DB connection
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();


// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// GET route
app.get("/", async (req, res) => {
  try {
    // Getting data from DB
    const result = await db.query("SELECT country_code FROM visited_countries");
    const data = result.rows;
    // formatting the data and storing it into countries variable
    let countries = [];
    data.forEach(country => {
      countries.push(country.country_code);
    });
    //rendering the ejs file with the data
    res.render("index.ejs", { countries: countries, total: countries.length });
    db.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    db.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
