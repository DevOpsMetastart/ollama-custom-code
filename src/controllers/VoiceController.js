const VoiceService = require('../services/voiceservice');
const path = require('path');

async function processVoiceInput(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  const audioFilePath = path.resolve(req.file.path);

  try {
    const result = await VoiceService.processVoiceInput(audioFilePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ transcription: null, response: 'I am sorry, I am having trouble.' });
  }
}

module.exports = {
  processVoiceInput,
};
