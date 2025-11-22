const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Clock In (Employee)
router.post('/clock-in', authenticateToken, async (req, res) => {
    const { task_id, notes } = req.body;
    const user_id = req.user.id;
    const start_time = new Date().toISOString();

    if (!task_id) {
        return res.status(400).json({ message: 'Task selection is mandatory' });
    }

    try {
        // Check if already clocked in
        const checkResult = await db.query(
            'SELECT * FROM shifts WHERE user_id = $1 AND end_time IS NULL',
            [user_id]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: 'Already clocked in' });
        }

        const result = await db.query(
            'INSERT INTO shifts (user_id, task_id, start_time, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [user_id, task_id, start_time, notes, 'pending']
        );

        res.status(201).json({ id: result.rows[0].id, start_time, status: 'pending' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Clock Out (Employee)
router.post('/clock-out', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const end_time = new Date().toISOString();

    try {
        const checkResult = await db.query(
            'SELECT * FROM shifts WHERE user_id = $1 AND end_time IS NULL',
            [user_id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(400).json({ message: 'Not clocked in' });
        }

        const shift = checkResult.rows[0];

        await db.query(
            'UPDATE shifts SET end_time = $1 WHERE id = $2',
            [end_time, shift.id]
        );

        res.json({ message: 'Clocked out successfully', end_time });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get My History (Employee)
router.get('/my-history', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await db.query(
            `SELECT s.*, t.name as task_name,
            ROUND(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600, 2) as total_hours,
            r.status as request_status
         FROM shifts s 
         JOIN tasks t ON s.task_id = t.id 
         LEFT JOIN shift_change_requests r ON s.id = r.shift_id AND r.status = 'pending'
         WHERE s.user_id = $1 
         ORDER BY s.start_time DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get Current Status (Employee)
router.get('/status', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await db.query(
            `SELECT s.*, t.name as task_name 
         FROM shifts s 
         JOIN tasks t ON s.task_id = t.id 
         WHERE s.user_id = $1 AND s.end_time IS NULL`,
            [user_id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});


// Get All Shifts (Admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    const { user_id, start_date, end_date } = req.query;

    let query = `
    SELECT s.*, u.name as user_name, t.name as task_name,
    ROUND(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600, 2) as total_hours
    FROM shifts s 
    JOIN users u ON s.user_id = u.id 
    JOIN tasks t ON s.task_id = t.id
    WHERE 1=1
  `;
    let params = [];
    let paramCount = 0;

    if (user_id) {
        paramCount++;
        query += ` AND s.user_id = $${paramCount}`;
        params.push(user_id);
    }
    if (start_date) {
        paramCount++;
        query += ` AND s.start_time >= $${paramCount}`;
        params.push(start_date);
    }
    if (end_date) {
        paramCount++;
        query += ` AND s.start_time <= $${paramCount}`;
        params.push(end_date);
    }

    query += ' ORDER BY s.start_time DESC';

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update Shift (Admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { start_time, end_time, task_id, notes, status } = req.body;

    try {
        const result = await db.query(
            'UPDATE shifts SET start_time = $1, end_time = $2, task_id = $3, notes = $4, status = $5 WHERE id = $6',
            [start_time, end_time, task_id, notes, status, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Shift not found' });
        res.json({ message: 'Shift updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});



// Delete Shift (Admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM shifts WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Shift not found' });
        res.json({ message: 'Shift deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create Shift (Admin)
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
    const { user_id, task_id, start_time, end_time, notes } = req.body;

    if (!user_id || !task_id || !start_time) {
        return res.status(400).json({ message: 'User, Task, and Start Time are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO shifts (user_id, task_id, start_time, end_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [user_id, task_id, start_time, end_time, notes, 'approved']
        );
        res.status(201).json({ message: 'Shift created successfully', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Request Shift Change (Employee)
router.post('/:id/request-change', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { new_start_time, new_end_time, reason } = req.body;
    const user_id = req.user.id;

    try {
        const result = await db.query(
            'INSERT INTO shift_change_requests (shift_id, user_id, new_start_time, new_end_time, reason) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [id, user_id, new_start_time, new_end_time, reason]
        );
        res.status(201).json({ message: 'Request submitted successfully', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
