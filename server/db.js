const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
    )`);

    // Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
    )`);

    // Shifts Table
    db.run(`CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      notes TEXT,
      status TEXT CHECK(status IN ('approved', 'pending', 'edited')) DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )`);

    // Shift Change Requests Table
    db.run(`CREATE TABLE IF NOT EXISTS shift_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      new_start_time TEXT NOT NULL,
      new_end_time TEXT NOT NULL,
      reason TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES shifts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });
}

module.exports = db;
