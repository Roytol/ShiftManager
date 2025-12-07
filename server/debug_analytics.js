const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Checking database table...');

        // List all tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:', tables.rows.map(r => r.table_name));

        // Check analytics_events
        const exists = tables.rows.find(r => r.table_name === 'analytics_events');
        if (exists) {
            const count = await pool.query('SELECT count(*) FROM analytics_events');
            console.log('Row count in analytics_events:', count.rows[0].count);

            const rows = await pool.query('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 5');
            console.log('Recent rows:', rows.rows);
        } else {
            console.log('❌ Table analytics_events does NOT exist.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

check();
