const db = require('./db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    const email = 'admin@example.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = 'Admin User';
    const role = 'admin';

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (row) {
            console.log('Admin user already exists.');
        } else {
            db.run(
                'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, role, 'active'],
                (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log('Admin user created successfully.');
                        console.log('Email: admin@example.com');
                        console.log('Password: admin');
                    }
                }
            );
        }
    });
};

seedAdmin();
