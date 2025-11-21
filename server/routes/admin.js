const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get All Change Requests
router.get('/change-requests', authenticateToken, isAdmin, (req, res) => {
    db.all(
        `SELECT r.*, u.name as user_name, s.start_time as original_start_time, s.end_time as original_end_time, t.name as task_name
         FROM shift_change_requests r
         JOIN users u ON r.user_id = u.id
         JOIN shifts s ON r.shift_id = s.id
         JOIN tasks t ON s.task_id = t.id
         WHERE r.status = 'pending'
         ORDER BY r.created_at DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json(rows);
        }
    );
});

// Approve Change Request
router.post('/change-requests/:id/approve', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM shift_change_requests WHERE id = ?', [id], (err, request) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Update Shift
            db.run(
                'UPDATE shifts SET start_time = ?, end_time = ?, status = ? WHERE id = ?',
                [request.new_start_time, request.new_end_time, 'edited', request.shift_id],
                function (err) {
                    if (err) {
                        console.error('Error updating shift:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Failed to update shift' });
                    }

                    // Update Request Status
                    db.run(
                        'UPDATE shift_change_requests SET status = ? WHERE id = ?',
                        ['approved', id],
                        function (err) {
                            if (err) {
                                console.error('Error updating request status:', err);
                                db.run('ROLLBACK');
                                return res.status(500).json({ message: 'Failed to update request status' });
                            }

                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).json({ message: 'Transaction commit failed' });
                                }
                                res.json({ message: 'Request approved and shift updated' });
                            });
                        }
                    );
                }
            );
        });
    });
});

// Reject Change Request
router.post('/change-requests/:id/reject', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE shift_change_requests SET status = ? WHERE id = ?',
        ['rejected', id],
        function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ message: 'Request not found' });
            res.json({ message: 'Request rejected' });
        }
    );
});

module.exports = router;
