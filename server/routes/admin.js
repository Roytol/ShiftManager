const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get All Change Requests
router.get('/change-requests', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT r.*, u.name as user_name, s.start_time as original_start_time, s.end_time as original_end_time, t.name as task_name
             FROM shift_change_requests r
             JOIN users u ON r.user_id = u.id
             JOIN shifts s ON r.shift_id = s.id
             JOIN tasks t ON s.task_id = t.id
             WHERE r.status = 'pending'
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Approve Change Request
router.post('/change-requests/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await db.pool.connect();

    try {
        const requestResult = await client.query('SELECT * FROM shift_change_requests WHERE id = $1', [id]);
        const request = requestResult.rows[0];

        if (!request) {
            client.release();
            return res.status(404).json({ message: 'Request not found' });
        }

        await client.query('BEGIN');

        // Update Shift
        await client.query(
            'UPDATE shifts SET start_time = $1, end_time = $2, status = $3 WHERE id = $4',
            [request.new_start_time, request.new_end_time, 'edited', request.shift_id]
        );

        // Update Request Status
        await client.query(
            'UPDATE shift_change_requests SET status = $1 WHERE id = $2',
            ['approved', id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Request approved and shift updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', err);
        res.status(500).json({ message: 'Failed to approve request' });
    } finally {
        client.release();
    }
});

// Reject Change Request
router.post('/change-requests/:id/reject', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'UPDATE shift_change_requests SET status = $1 WHERE id = $2',
            ['rejected', id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
