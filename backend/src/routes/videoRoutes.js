const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Route to fetch metadata for a video
router.post('/fetch-metadata', videoController.fetchMetadata);

// Route to process a video download
router.post('/process', videoController.processVideo);

module.exports = router;
