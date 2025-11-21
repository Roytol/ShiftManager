const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Clock In (Employee)
router.post('/clock-in', authenticateToken, (req, res) => {
    const { task_id, notes } = req.body;
    const user_id = req.user.id;
    const start_time = new Date().toISOString();

    if (!task_id) {
        return res.status(400).json({ message: 'Task selection is mandatory' });
    }

    // Check if already clocked in
    db.get(
        'SELECT * FROM shifts WHERE user_id = ? AND end_time IS NULL',
        [user_id],
        (err, row) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (row) return res.status(400).json({ message: 'Already clocked in' });

            db.run(
                'INSERT INTO shifts (user_id, task_id, start_time, notes, status) VALUES (?, ?, ?, ?, ?)',
                [user_id, task_id, start_time, notes, 'pending'],
                function (err) {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    res.status(201).json({ id: this.lastID, start_time, status: 'pending' });
                }
            );
        }
    );
});

// Clock Out (Employee)
router.post('/clock-out', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const end_time = new Date().toISOString();

    db.get(
        'SELECT * FROM shifts WHERE user_id = ? AND end_time IS NULL',
        [user_id],
        (err, row) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (!row) return res.status(400).json({ message: 'Not clocked in' });

            db.run(
                'UPDATE shifts SET end_time = ? WHERE id = ?',
                [end_time, row.id],
                function (err) {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    res.json({ message: 'Clocked out successfully', end_time });
                }
            );
        }
    );
});

// Get My History (Employee)
router.get('/my-history', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.all(
        `SELECT s.*, t.name as task_name,
        ROUND((JULIANDAY(s.end_time) - JULIANDAY(s.start_time)) * 24, 2) as total_hours,
        r.status as request_status
     FROM shifts s 
     JOIN tasks t ON s.task_id = t.id 
     LEFT JOIN shift_change_requests r ON s.id = r.shift_id AND r.status = 'pending'
     WHERE s.user_id = ? 
     ORDER BY s.start_time DESC`,
        [user_id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json(rows);
        }
    );
});

// Get Current Status (Employee)
router.get('/status', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.get(
        `SELECT s.*, t.name as task_name 
     FROM shifts s 
     JOIN tasks t ON s.task_id = t.id 
     WHERE s.user_id = ? AND s.end_time IS NULL`,
        [user_id],
        (err, row) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json(row || null);
        }
    );
});


// Get All Shifts (Admin)
router.get('/', authenticateToken, isAdmin, (req, res) => {
    const { user_id, start_date, end_date } = req.query;

    let query = `
    SELECT s.*, u.name as user_name, t.name as task_name,
    ROUND((JULIANDAY(s.end_time) - JULIANDAY(s.start_time)) * 24, 2) as total_hours
    FROM shifts s 
    JOIN users u ON s.user_id = u.id 
    JOIN tasks t ON s.task_id = t.id
    WHERE 1=1
  `;
    let params = [];

    if (user_id) {
        query += ' AND s.user_id = ?';
        params.push(user_id);
    }
    if (start_date) {
        query += ' AND s.start_time >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND s.start_time <= ?';
        params.push(end_date);
    }

    query += ' ORDER BY s.start_time DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Update Shift (Admin)
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { start_time, end_time, task_id, notes, status } = req.body;

    db.run(
        'UPDATE shifts SET start_time = ?, end_time = ?, task_id = ?, notes = ?, status = ? WHERE id = ?',
        [start_time, end_time, task_id, notes, status, id],
        function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ message: 'Shift not found' });
            res.json({ message: 'Shift updated successfully' });
        }
    );
});



// Delete Shift (Admin)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM shifts WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ message: 'Shift not found' });
        res.json({ message: 'Shift deleted successfully' });
    });
});

// Create Shift (Admin)
router.post('/create', authenticateToken, isAdmin, (req, res) => {
    const { user_id, task_id, start_time, end_time, notes } = req.body;

    if (!user_id || !task_id || !start_time) {
        return res.status(400).json({ message: 'User, Task, and Start Time are required' });
    }

    db.run(
        'INSERT INTO shifts (user_id, task_id, start_time, end_time, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, task_id, start_time, end_time, notes, 'approved'],
        function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.status(201).json({ message: 'Shift created successfully', id: this.lastID });
        }
    );
});

// Request Shift Change (Employee)
router.post('/:id/request-change', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { new_start_time, new_end_time, reason } = req.body;
    const user_id = req.user.id;

    db.run(
        'INSERT INTO shift_change_requests (shift_id, user_id, new_start_time, new_end_time, reason) VALUES (?, ?, ?, ?, ?)',
        [id, user_id, new_start_time, new_end_time, reason],
        function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.status(201).json({ message: 'Request submitted successfully', id: this.lastID });
        }
    );
});

module.exports = router;
