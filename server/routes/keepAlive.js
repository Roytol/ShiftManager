const express = require('express');
const router = express.Router();
const db = require('../db');

// Keep-alive endpoint
router.get('/', async (req, res) => {
    try {
        // Simple query to keep the database connection active
        await db.query('SELECT 1');
        res.status(200).json({ status: 'ok', message: 'Keep-alive successful' });
    } catch (err) {
        console.error('Keep-alive error:', err);
        res.status(500).json({ status: 'error', message: 'Keep-alive failed' });
    }
});

module.exports = router;
