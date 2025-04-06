const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/download-path', systemController.getDownloadPath);
router.post('/download-path', systemController.setDownloadPath);
router.get('/open-download-folder', systemController.openDownloadFolder);

module.exports = router;
