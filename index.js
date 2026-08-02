import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


import pg from "pg";
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: process.env.DB_PASSWORD,
  port: 5433,
});
db.connect();
const app = express();
const port = 3000;
const month = new Date().getMonth();
console.log(month);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/")),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", async (req, res) => {
  const search = req.query.search;

  let result;

  if (search) {
    result = await db.query(
      "SELECT * FROM books WHERE title ILIKE $1 ORDER BY id",
      [`%${search}%`],
    );
  } else {
    result = await db.query("SELECT * FROM books ORDER BY id");
  }

  res.render("index.ejs", {
    books: result.rows,
  });
});

app.get("/add", (req, res) => {
  res.render("new.ejs");
});

app.post("/new", async (req, res) => {
  const title = req.body.title;
  const book_note = req.body.note;

  const response = await axios.get("https://openlibrary.org/search.json", {
    params: {
      title: req.body.title,
    },
  });
  const book = response.data.docs[0];
  const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
  const firstPublishDate = book.first_publish_year;
  await db.query(
    "INSERT INTO books (title,book_not,date_read,cover_url) VALUES ($1,$2,$3,$4) RETURNING *",
    [title, book_note, firstPublishDate, coverUrl],
  );

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`port ${port} çalışıyor`);
});
