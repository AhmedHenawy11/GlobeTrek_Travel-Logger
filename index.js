import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Configs
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
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// controllers

async function checkVisisted() {
  console.log("Welcome Home");

  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function errorHandler (res,error) {
  console.error(error);
  const countries = await checkVisisted();
  res.render("index.ejs",{ countries: countries, total: countries.length, error: error });
}



// Routes

// Get all visited countries
app.get("/", async (req, res) => {
  try {
    const countries = await checkVisisted();
    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// POST route to add new country
app.post('/add', async (req, res) => {
  try {
    const input = req.body.country;

    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [input]
    );
    
    if (result.rows.length !== 0) {
      const data = result.rows[0];
      const country_code = data.country_code;
      console.log(country_code);
      await db.query('INSERT INTO visited_countries (country_code) VALUES ($1)', [country_code]);
      res.redirect("/");
    }else{
      errorHandler(res,"Country name doesn't exist");
    }

  } catch (error) {
    errorHandler(res,"Country name doesn't exist");
  }
})
// POST route to remove visited country 
app.post('/remove', async(req, res) => {
  const input = req.body.country;
  console.log(req.body);
  //STEP 1: get the country code of the input/////////////////////////////////////////////
  const getCode = await db.query(
    "SELECT country_code FROM countries WHERE country_name = $1",
    [input]
  );
  
  if (getCode.rows.length !== 0)
  {
    const data = getCode.rows[0];
    const country_code = data.country_code;
    console.log(country_code);

  //STEP2 : check if the country in vistid_countries table.
    const countries = await checkVisisted();
    if (countries.includes(country_code))
    {
        await db.query('DELETE FROM visited_countries WHERE country_code= $1', [country_code]);
        console.log('country removed')
        res.redirect("/");
    }

  }else
  {
    errorHandler(res,"Country not found");
  }
})





app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
