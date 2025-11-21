const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
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
    });
});

// Get Current User (Me)
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        db.get('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        });
    });
});

module.exports = router;
