import 'dotenv/config';
import pool from './server/db.js';

console.log("Testing database connection...");
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

const test = async () => {
    try {
        console.log("Attempting query...");
        const start = Date.now();
        const res = await pool.query('SELECT NOW()');
        console.log("Query successful in", Date.now() - start, "ms");
        console.log("Result:", res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error("Database connection error:", err.message);
        if (err.code) console.error("Error Code:", err.code);
        process.exit(1);
    }
};

test();

setTimeout(() => {
    console.error("Test timed out.");
    process.exit(1);
}, 6000);
