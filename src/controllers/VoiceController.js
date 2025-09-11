const { nodewhisper } = require('nodejs-whisper');
const { Ollama } = require('ollama');
const fs = require('fs');
const path = require('path');

// Initialize the Ollama client
const ollama = new Ollama();

// Configuration
const WHISPER_MODEL = 'base.en'; // Specify the Whisper model to download
const WHISPER_MODEL_PATH = 'node_modules/nodejs-whisper/cpp/whisper.cpp/models/ggml-base.en.bin';
const OLLAMA_MODEL = 'llama2';    // The Ollama model to use

// Function to handle the voice input
async function processVoiceInput(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  const audioFilePath = path.resolve(req.file.path);

  try {
    // 1. Transcribe the audio file using the local Whisper model
    console.log('Transcribing audio...');
    const transcriptionResult = await nodewhisper(audioFilePath, {
      modelName: WHISPER_MODEL,
      modelPath: WHISPER_MODEL_PATH,
      autoDownloadModelName: WHISPER_MODEL,
      removeWavFileAfterTranscription: true,
      whisperOptions: {
        outputInText: true,
      },
    });

    const transcribedText = transcriptionResult;
    console.log(`User said: ${transcribedText}`);

    // 2. Send the transcribed text to the Ollama server
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: transcribedText }],
    });
    const ollamaResponse = response.message.content;
    console.log(`Ollama responded: ${ollamaResponse}`);

    res.json({ transcription: transcribedText, response: ollamaResponse });
  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({ transcription: null, response: 'I am sorry, I am having trouble.' });
  } finally {
    // Clean up the uploaded audio file
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
  }
}

module.exports = {
  processVoiceInput,
};
