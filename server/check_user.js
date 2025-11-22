const db = require('./db');

async function checkUser() {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
        if (result.rows.length > 0) {
            console.log('User found:', result.rows[0]);
        } else {
            console.log('User not found');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        process.exit();
    }
}

checkUser();
