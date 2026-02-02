import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-123';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
const { verbose } = sqlite3;
const sqlite = verbose();
const db = new sqlite.Database('./expenses.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            createdAt TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            userId TEXT,
            title TEXT,
            amount REAL,
            category TEXT,
            date TEXT,
            type TEXT,
            accountId TEXT,
            createdAt TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            userId TEXT,
            name TEXT,
            balance REAL,
            color TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            userId TEXT,
            name TEXT,
            target REAL,
            current REAL,
            deadline TEXT,
            color TEXT
        )`);

        // Migration logic: Add userId to existing tables if missing
        ['expenses', 'accounts', 'goals'].forEach(table => {
            db.all(`PRAGMA table_info(${table})`, (err, rows) => {
                if (rows && !rows.find(row => row.name === 'userId')) {
                    db.run(`ALTER TABLE ${table} ADD COLUMN userId TEXT`);
                }
            });
        });
    }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { id, name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("INSERT INTO users (id, name, email, password, createdAt) VALUES (?,?,?,?,?)",
        [id, name, email, hashedPassword, new Date().toISOString()],
        (err) => {
            if (err) return res.status(400).json({ error: "Email already exists" });

            // Auto-create default accounts for new user
            db.run("INSERT INTO accounts (id, userId, name, balance, color) VALUES (?,?,?,?,?)", [`acc_bank_${id}`, id, 'Bank', 0, '#2962ff']);
            db.run("INSERT INTO accounts (id, userId, name, balance, color) VALUES (?,?,?,?,?)", [`acc_cash_${id}`, id, 'Cash', 0, '#FFA000']);

            res.json({ message: "User registered successfully" });
        });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// --- Accounts ---
app.get('/api/accounts', authenticateToken, (req, res) => {
    db.all("SELECT * FROM accounts WHERE userId = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.post('/api/accounts', authenticateToken, (req, res) => {
    const { id, name, balance, color } = req.body;
    db.run("INSERT INTO accounts (id, userId, name, balance, color) VALUES (?,?,?,?,?)",
        [id, req.user.id, name, balance, color], (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", data: req.body });
        });
});

app.patch('/api/accounts/:id', authenticateToken, (req, res) => {
    const { balance } = req.body;
    db.run("UPDATE accounts SET balance = ? WHERE id = ? AND userId = ?",
        [balance, req.params.id, req.user.id], (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success" });
        });
});

// --- Goals ---
app.get('/api/goals', authenticateToken, (req, res) => {
    db.all("SELECT * FROM goals WHERE userId = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.post('/api/goals', authenticateToken, (req, res) => {
    const { id, name, target, current, deadline, color } = req.body;
    db.run("INSERT INTO goals (id, userId, name, target, current, deadline, color) VALUES (?,?,?,?,?,?,?)",
        [id, req.user.id, name, target, current, deadline, color], (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", data: req.body });
        });
});

app.patch('/api/goals/:id', authenticateToken, (req, res) => {
    const { current } = req.body;
    db.run("UPDATE goals SET current = ? WHERE id = ? AND userId = ?",
        [current, req.params.id, req.user.id], (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success" });
        });
});

// --- Expenses ---
app.get('/api/expenses', authenticateToken, (req, res) => {
    db.all("SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "data": rows });
    });
});

app.post('/api/expenses', authenticateToken, (req, res) => {
    const { id, title, amount, category, date, type, accountId, createdAt } = req.body;
    const sql = 'INSERT INTO expenses (id, userId, title, amount, category, date, type, accountId, createdAt) VALUES (?,?,?,?,?,?,?,?,?)';
    const params = [id, req.user.id, title, amount, category, date, type, accountId, createdAt];

    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "data": req.body });
    });
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM expenses WHERE id = ? AND userId = ?';
    db.run(sql, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- Serve Frontend Static Files ---
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
