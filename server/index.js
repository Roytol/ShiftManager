const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const shiftRoutes = require('./routes/shifts');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('Time Tracking API is running');
});

// Routes will be imported here later

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
