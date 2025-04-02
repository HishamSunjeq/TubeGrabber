const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Route to fetch metadata for a video
router.post('/fetch-metadata', videoController.fetchMetadata);

// Route to process a video download
router.post('/process', videoController.processVideo);

// Route to get download status
router.get('/download-status/:downloadId', videoController.getDownloadStatus);

// Route to download a completed file
router.get('/download-file/:downloadId', videoController.downloadFile);

// Route to cancel a download
router.post('/cancel-download/:downloadId', videoController.cancelDownload);

// Route for direct download (support both POST and GET)
router.post('/direct-download', videoController.directDownload);
router.get('/direct-download', videoController.directDownload);

module.exports = router;
