const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function seed() {
    try {
        console.log('Seeding database...');

        // Check if admin already exists
        const checkRes = await pool.query("SELECT * FROM users WHERE email = 'admin@example.com'");
        if (checkRes.rows.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        await pool.query(
            "INSERT INTO users (name, email, password, role, status, employee_code) VALUES ($1, $2, $3, $4, $5, $6)",
            ['Admin User', 'admin@example.com', hashedPassword, 'admin', 'active', 'ADMIN001']
        );

        console.log('✅ Admin user created successfully.');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    }
}

seed();
