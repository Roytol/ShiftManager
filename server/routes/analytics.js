const express = require('express');
const db = require('../db');

const router = express.Router();

// Log Event
router.post('/log', async (req, res) => {
    const { event_type } = req.body;

    if (!event_type) {
        return res.status(400).json({ message: 'Event type is required' });
    }

    try {
        await db.query(
            "INSERT INTO analytics_events (event_type) VALUES ($1)",
            [event_type]
        );

        res.status(201).json({ message: 'Event logged' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Debug Endpoint
router.get('/debug', async (req, res) => {
    try {
        const result = await db.query('SELECT count(*) FROM analytics_events');
        const rows = await db.query('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 5');
        res.json({
            count: result.rows[0].count,
            recent: rows.rows,
            message: 'Analytics table is accessible'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Database error or table missing',
            error: err.message
        });
    }
});

module.exports = router;
