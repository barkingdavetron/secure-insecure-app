README – Secure Blog App Project Overview

Secure blog-style web application built with Node.js and Express

Two branches: insecure (with vulnerabilities) and secure (with mitigations)

Demonstrates common web security flaws and best practices

Setup Instructions

Clone the repository:

    git clone https://github.com/your-username/secure-blog-app.git

    cd secure-blog-app

Install dependencies:

    npm install

Run the server:

    node app.js

Visit the app:

    http://localhost:3000

How to Use

Register at /register

Log in at /login

View all posts on the /dashboard

Create a new post at /create

Technologies Used

Node.js

Express

SQLite3

EJS

bcrypt

csurf

express-session

Selenium WebDriver

OWASP ZAP

Chrome Developer Tools

Project Structure

app.js: Main server file

views/: EJS template files for register, login, dashboard, create, domxss

database.db: SQLite3 database

test_login.js: Selenium test script

Security Testing

Functional testing with Selenium

Non-functional testing with Chrome Developer Tools

DAST scanning using OWASP ZAP

Vulnerabilities documented and addressed in the secure version

Key Security Headers Added

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

X-XSS-Protection: 1; mode=block

Referrer-Policy: no-referrer

Logging and Monitoring

Registration and login attempts logged to console

Logs include user actions such as creating a post or logging out

Errors captured and printed with context

