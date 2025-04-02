const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const videoRoutes = require('./routes/videoRoutes');

// Create uploads directories if they don't exist
fs.ensureDirSync(path.join(__dirname, '../uploads/videos'));
fs.ensureDirSync(path.join(__dirname, '../uploads/audio'));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/downloads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', videoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: true, 
    message: err.message || 'Something went wrong on the server' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
