const express = require('express');
const cors = require('cors');
const videoRoutes = require('./routes/videoRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', videoRoutes);
app.use('/api', systemRoutes);

module.exports = app;
