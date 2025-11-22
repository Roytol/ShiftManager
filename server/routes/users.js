const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    const query = `
        SELECT u.id, u.name, u.email, u.role, u.status, u.employee_code, u.birthdate,
        CASE WHEN EXISTS (
            SELECT 1 FROM shifts s WHERE s.user_id = u.id AND s.end_time IS NULL
        ) THEN 1 ELSE 0 END as is_clocked_in
        FROM users u
    `;

    try {
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get single user (Admin or Self)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        const result = await db.query('SELECT id, name, email, role, status, employee_code, birthdate FROM users WHERE id = $1', [id]);
        const row = result.rows[0];
        if (!row) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create new user (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { name, email, password, role, status, employee_code, birthdate } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await db.query(
            'INSERT INTO users (name, email, password, role, status, employee_code, birthdate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, email, hashedPassword, role, status || 'active', employee_code || null, birthdate || null]
        );
        res.status(201).json({ id: result.rows[0].id, name, email, role, status, employee_code, birthdate });
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update user (Admin or Self)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, status, employee_code, birthdate } = req.body;

    // Check permission: Admin can update anyone, User can only update themselves
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    let query = 'UPDATE users SET name = $1, email = $2, employee_code = $3, birthdate = $4';
    let params = [name, email, employee_code || null, birthdate || null];
    let paramCount = 4;

    if (req.user.role === 'admin') {
        if (role) {
            paramCount++;
            query += `, role = $${paramCount}`;
            params.push(role);
        }
        if (status) {
            paramCount++;
            query += `, status = $${paramCount}`;
            params.push(status);
        }
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        paramCount++;
        query += `, password = $${paramCount}`;
        params.push(hashedPassword);
    }

    paramCount++;
    query += ` WHERE id = $${paramCount}`;
    params.push(id);

    try {
        const result = await db.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
