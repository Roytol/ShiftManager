const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get tasks (Admin: all, Employee: active only)
router.get('/', authenticateToken, (req, res) => {
    let query = 'SELECT * FROM tasks';
    let params = [];

    if (req.user.role !== 'admin') {
        query += ' WHERE status = ?';
        params.push('active');
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(rows);
    });
});

// Create task (Admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
    const { name, status } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Task name is required' });
    }

    db.run(
        'INSERT INTO tasks (name, status) VALUES (?, ?)',
        [name, status || 'active'],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, name, status });
        }
    );
});

// Update task (Admin only)
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;

    db.run(
        'UPDATE tasks SET name = ?, status = ? WHERE id = ?',
        [name, status, id],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }
            res.json({ message: 'Task updated successfully' });
        }
    );
});

// Delete task (Admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;

    // First check if there are any shifts associated with this task
    db.get('SELECT COUNT(*) as count FROM shifts WHERE task_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error checking dependencies' });
        }

        if (row.count > 0) {
            return res.status(400).json({
                message: 'Cannot delete task because it has associated shifts. Please deactivate it instead.'
            });
        }

        // If no dependencies, proceed with deletion
        db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Database error deleting task' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        });
    });
});

module.exports = router;
