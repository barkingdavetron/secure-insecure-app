//require 
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database('./database.db');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
//db setup
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);


// Landing page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Register
app.get('/register', (req, res) => res.render('register'));

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // No validation and no hashing
  db.run(`INSERT INTO users (email, password) VALUES ('${email}', '${password}')`, () => {
    res.redirect('/login');
  });
});

// Login vulnerable as  SQL Injection possible
app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  const { email, password } = req.body;
//sql injection possible here
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`; 
  db.get(query, (err, user) => {
    if (user) {
      res.redirect(`/dashboard?user_id=${user.id}`); 
    } else {
      res.send('Login failed');
    }
  });
});

// Dashboard with posts vulnerable to xss
app.get('/dashboard', (req, res) => {
  const user_id = req.query.user_id;

  db.all("SELECT * FROM posts", (err, posts) => {
    res.render('dashboard', { user_id, posts });
  });
});

// Create post with no sanitization
app.get('/create', (req, res) => {
  const user_id = req.query.user_id;
  res.render('create', { user_id });
});
// Reflected XSS 
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`
    <h1>Search Results for: ${query}</h1>
    <form action="/search">
      <input type="text" name="q" />
      <button type="submit">Search</button>
    </form>
  `);
});
app.get('/domxss', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'domxss.html'));
});
//create post 
app.post('/create', (req, res) => {
  const { user_id, content } = req.body;

  db.run(`INSERT INTO posts (user_id, content) VALUES (${user_id}, '${content}')`, () => {
    res.redirect(`/dashboard?user_id=${user_id}`);
  });
});

// Run server
const PORT = 3000;
app.listen(PORT, () => console.log(`Insecure app running on http://localhost:${PORT}`));
