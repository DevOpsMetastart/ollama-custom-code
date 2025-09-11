const express = require('express');
const multer = require('multer');
const path = require('path');
const { processVoiceInput } = require('../controllers/VoiceController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') });

router.post('/upload-audio', upload.single('audio'), processVoiceInput);

module.exports = router;
