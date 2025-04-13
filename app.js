// app.js (secure version with logging user input + session)
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csurf = require('csurf');
const bcrypt = require('bcrypt');
const app = express();
const db = new sqlite3.Database('./database.db');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'secureBlogSecret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false } // secure: true if using HTTPS
}));
app.use(csurf({ cookie: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  //csp header
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'");
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CSRF session for views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.session = req.session;
  next();
});

// Create tables
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user'
)`);

db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Middleware 
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// Routes
app.get('/', (req, res) => res.redirect('/login'));
//register route
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[REGISTER INPUT] Email: ${email}, Password: ${password}`);
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], (err) => {
    if (err) {
      console.error(`[REGISTER ERROR] ${err.message}`);
      return res.send('Error registering user');
    }
    console.log(`[REGISTERED USER] Email: ${email}`);
    res.redirect('/login');
  });
});
//login reoute
app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] Email: ${email}, Password: ${password}`);
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      console.warn(`[LOGIN FAILED] No user for: ${email}`);
      return res.send('Login failed');
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user.id;
      req.session.role = user.role;
      console.log(`[LOGIN SUCCESS] User: ${email}`);
      res.redirect('/dashboard');
    } else {
      console.warn(`[LOGIN FAILED] Incorrect password for: ${email}`);
      res.send('Login failed');
    }
  });
});
//logout route
app.get('/logout', (req, res) => {
  const user = req.session.userId;
  req.session.destroy(() => {
    console.log(`[LOGOUT] User ID: ${user}`);
    res.redirect('/login');
  });
});
//dashboard route
app.get('/dashboard', requireLogin, (req, res) => {
  db.all("SELECT * FROM posts", (err, posts) => {
    if (err) return res.send('Error loading dashboard');
    res.render('dashboard', { user_id: req.session.userId, posts });
  });
});
app.get('/create', requireLogin, (req, res) => {
  res.render('create', { user_id: req.session.userId });
});

app.post('/create', requireLogin, (req, res) => {
  const { content } = req.body;
  const user_id = req.session.userId;
  console.log(`[POST CREATED] User: ${user_id}, Content: ${content}`);
  db.run(`INSERT INTO posts (user_id, content) VALUES (?, ?)`, [user_id, content], (err) => {
    if (err) {
      console.error(`[CREATE ERROR] ${err.message}`);
      return res.send('Error creating post');
    }
    res.redirect('/dashboard');
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Secure app running on http://localhost:${PORT}`));
