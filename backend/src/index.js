const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Basic Health Check
app.get('/', (req, res) => {
    res.send('API Backend Running');
});

/**
 * Migration Helper
 */
const ensureColumn = async (table, column, definition) => {
    const check = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2",
        [table, column]
    );
    if (check.rows.length === 0) {
        console.log(`Migrating: Adding ${column} column to ${table}...`);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
};

/**
 * Database Initialization & Server Start
 */
const initDbAndStartServer = async () => {
    try {
        // 1. Read and execute schema
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schemaSql);
        }

        // 2. Auto-Migrations (for existing tables)
        await ensureColumn('users', 'name', 'VARCHAR(255)');
        await ensureColumn('users', 'avatar_url', 'TEXT');
        await ensureColumn('users', 'active', 'BOOLEAN DEFAULT TRUE');
        await ensureColumn('users', 'role', "VARCHAR(50) DEFAULT 'user'");

        // 3. Admin Seeding
        const adminEmail = process.env.ADMIN_EMAIL || 'jock.alcantara@gmail.com';
        const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (adminCheck.rows.length === 0) {
            console.log('Seeding: Creating initial Admin user...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);

            await pool.query(
                "INSERT INTO users (email, password_hash, role, is_verified, active, name) VALUES ($1, $2, 'admin', TRUE, TRUE, 'Admin')",
                [adminEmail, hash]
            );
        } else {
            // Ensure permissions
            const existing = adminCheck.rows[0];
            if (existing.role !== 'admin') {
                console.log('Seeding: Promoting user to admin...');
                await pool.query("UPDATE users SET role='admin' WHERE email=$1", [adminEmail]);
            }
        }

        console.log('Database initialized successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
};

initDbAndStartServer();
