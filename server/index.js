import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting SpendWise Server (PostgreSQL Mode)...");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-123';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Initialization
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                createdAt TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                userId TEXT REFERENCES users(id),
                name TEXT,
                balance NUMERIC,
                color TEXT
            );
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                userId TEXT REFERENCES users(id),
                title TEXT,
                amount NUMERIC,
                category TEXT,
                date TEXT,
                type TEXT,
                accountId TEXT REFERENCES accounts(id),
                createdAt TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                userId TEXT REFERENCES users(id),
                name TEXT,
                target NUMERIC,
                current NUMERIC,
                deadline TEXT,
                color TEXT
            );
            CREATE TABLE IF NOT EXISTS emi (
                id TEXT PRIMARY KEY,
                userId TEXT REFERENCES users(id),
                name TEXT,
                amount NUMERIC,
                nextDate TEXT,
                totalTenure INTEGER,
                paidTenure INTEGER
            );
            CREATE TABLE IF NOT EXISTS limits (
                id TEXT PRIMARY KEY,
                userId TEXT REFERENCES users(id),
                category TEXT,
                "limit" NUMERIC,
                month TEXT
            );
        `);
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};
initDb();

// Health Check for Render
app.get('/health', (req, res) => res.status(200).send('OK'));

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
    try {
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)",
            [id, name, email, hashedPassword]
        );

        // Auto-create default accounts for new user
        await pool.query("INSERT INTO accounts (id, userId, name, balance, color) VALUES ($1, $2, $3, $4, $5)", [`acc_bank_${id}`, id, 'Bank', 0, '#2962ff']);
        await pool.query("INSERT INTO accounts (id, userId, name, balance, color) VALUES ($1, $2, $3, $4, $5)", [`acc_cash_${id}`, id, 'Cash', 0, '#FFA000']);

        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Accounts ---
app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM accounts WHERE userId = $1", [req.user.id]);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
    const { id, name, balance, color } = req.body;
    try {
        await pool.query(
            "INSERT INTO accounts (id, userId, name, balance, color) VALUES ($1, $2, $3, $4, $5)",
            [id, req.user.id, name, balance, color]
        );
        res.json({ message: "success", data: req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/accounts/:id', authenticateToken, async (req, res) => {
    const { balance } = req.body;
    try {
        const result = await pool.query(
            "UPDATE accounts SET balance = $1 WHERE id = $2 AND userId = $3 RETURNING *",
            [balance, req.params.id, req.user.id]
        );
        if (result.rows.length > 0) {
            return res.json({ message: "success" });
        }
        res.status(404).json({ error: "Account not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Goals ---
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM goals WHERE userId = $1", [req.user.id]);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
    const { id, name, target, current, deadline, color } = req.body;
    try {
        await pool.query(
            "INSERT INTO goals (id, userId, name, target, current, deadline, color) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [id, req.user.id, name, target, current, deadline, color]
        );
        res.json({ message: "success", data: req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/goals/:id', authenticateToken, async (req, res) => {
    const { current } = req.body;
    try {
        const result = await pool.query(
            "UPDATE goals SET current = $1 WHERE id = $2 AND userId = $3 RETURNING *",
            [current, req.params.id, req.user.id]
        );
        if (result.rows.length > 0) {
            return res.json({ message: "success" });
        }
        res.status(404).json({ error: "Goal not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Expenses ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses WHERE userId = $1 ORDER BY date DESC",
            [req.user.id]
        );
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
    const { id, title, amount, category, date, type, accountId, createdAt } = req.body;
    try {
        await pool.query(
            "INSERT INTO expenses (id, userId, title, amount, category, date, type, accountId, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [id, req.user.id, title, amount, category, date, type, accountId, createdAt]
        );
        res.json({ "message": "success", "data": req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM expenses WHERE id = $1 AND userId = $2",
            [req.params.id, req.user.id]
        );
        if (result.rowCount > 0) {
            return res.json({ "message": "deleted", changes: result.rowCount });
        }
        res.status(404).json({ "error": "Expense not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Serve Frontend Static Files ---
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is LIVE on port ${PORT}`);
});
