const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get tasks (Admin: all, Employee: active only)
router.get('/', authenticateToken, async (req, res) => {
    let query = 'SELECT * FROM tasks';
    let params = [];

    if (req.user.role !== 'admin') {
        query += ' WHERE status = $1';
        params.push('active');
    }

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create task (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { name, status } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Task name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO tasks (name, status) VALUES ($1, $2) RETURNING id',
            [name, status || 'active']
        );
        res.status(201).json({ id: result.rows[0].id, name, status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update task (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;

    try {
        const result = await db.query(
            'UPDATE tasks SET name = $1, status = $2 WHERE id = $3',
            [name, status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete task (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // First check if there are any shifts associated with this task
        const checkResult = await db.query('SELECT COUNT(*) as count FROM shifts WHERE task_id = $1', [id]);

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'Cannot delete task because it has associated shifts. Please deactivate it instead.'
            });
        }

        // If no dependencies, proceed with deletion
        const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
