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

module.exports = router;
