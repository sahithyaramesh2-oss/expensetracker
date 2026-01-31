import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
// verbose() returns a sqlite3 object
const { verbose } = sqlite3;
const sqlite = verbose();
const db = new sqlite.Database('./expenses.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT,
      amount REAL,
      category TEXT,
      date TEXT,
      type TEXT,
      createdAt TEXT
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);
    }
});

// Routes

// GET all expenses
app.get('/api/expenses', (req, res) => {
    db.all("SELECT * FROM expenses ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST new expense
app.post('/api/expenses', (req, res) => {
    const { id, title, amount, category, date, type, createdAt } = req.body;
    const sql = 'INSERT INTO expenses (id, title, amount, category, date, type, createdAt) VALUES (?,?,?,?,?,?,?)';
    const params = [id, title, amount, category, date, type, createdAt];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": req.body
        });
    });
});

// DELETE expense
app.delete('/api/expenses/:id', (req, res) => {
    const sql = 'DELETE FROM expenses WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
