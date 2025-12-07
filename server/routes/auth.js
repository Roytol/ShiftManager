const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, 'employee', 'active') RETURNING id, name, email, role, status",
            [name, email, hashedPassword]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            console.log(`[Auth] Login failed: User ${email} is inactive`);
            return res.status(403).json({ message: 'Account is inactive' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get Current User (Me)
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        try {
            const result = await db.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [decoded.id]);
            const user = result.rows[0];

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        }
    });
});

module.exports = router;
