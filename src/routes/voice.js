const express = require('express');
const multer = require('multer');
const { processVoiceInput } = require('../controllers/VoiceController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/upload-audio', upload.single('audio'), processVoiceInput);

module.exports = router;
