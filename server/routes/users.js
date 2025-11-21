const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, (req, res) => {
    const query = `
        SELECT u.id, u.name, u.email, u.role, u.status, u.employee_code, u.birthdate,
        CASE WHEN EXISTS (
            SELECT 1 FROM shifts s WHERE s.user_id = u.id AND s.end_time IS NULL
        ) THEN 1 ELSE 0 END as is_clocked_in
        FROM users u
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(rows);
    });
});

// Get single user (Admin or Self)
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    db.get('SELECT id, name, email, role, status, employee_code, birthdate FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(row);
    });
});

// Create new user (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { name, email, password, role, status, employee_code, birthdate } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        'INSERT INTO users (name, email, password, role, status, employee_code, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role, status || 'active', employee_code, birthdate],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ message: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, name, email, role, status, employee_code, birthdate });
        }
    );
});

// Update user (Admin or Self)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, status, employee_code, birthdate } = req.body;

    // Check permission: Admin can update anyone, User can only update themselves
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // If not admin, prevent changing role or status
    let newRole = role;
    let newStatus = status;
    if (req.user.role !== 'admin') {
        // Fetch current user data to keep role/status unchanged if not provided or if trying to change
        // For simplicity, we just ignore the request body for role/status if not admin, 
        // but we need to make sure we don't overwrite them with undefined if we were using a dynamic query builder.
        // Since we are constructing the query manually, we can just NOT update them if not admin.
        // However, the current query updates EVERYTHING.
        // Let's just force them to be the current values or ignore them in the query?
        // Easier: Just don't include them in the update if not admin?
        // But the query is hardcoded.
        // Let's fetch the existing user first to be safe and get current role/status.
        // OR, simpler: just don't allow changing them.
        // We will use the passed values if admin, otherwise we need to keep existing.
        // Actually, let's just restrict the query fields based on role.
    }

    // Better approach: Construct query dynamically or handle permissions strictly.
    // Let's stick to the existing pattern but add checks.

    let query = 'UPDATE users SET name = ?, email = ?, employee_code = ?, birthdate = ?';
    let params = [name, email, employee_code || '', birthdate || ''];

    if (req.user.role === 'admin') {
        if (role) {
            query += ', role = ?';
            params.push(role);
        }
        if (status) {
            query += ', status = ?';
            params.push(status);
        }
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function (err) {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

module.exports = router;
