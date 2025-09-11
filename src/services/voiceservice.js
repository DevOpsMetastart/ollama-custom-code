const { nodewhisper } = require('nodejs-whisper');
const OllamaService = require('./OllamaService');
const fs = require('fs');
const path = require('path');

// Initialize the Ollama service
const ollamaService = new OllamaService();

// Configuration
const WHISPER_MODEL = 'base.en'; // Specify the Whisper model to download
const WHISPER_MODEL_PATH = 'node_modules/nodejs-whisper/cpp/whisper.cpp/models/ggml-base.en.bin';

class VoiceService {
  async processVoiceInput(audioFilePath) {
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

      let transcribedText = transcriptionResult;
      console.log(`User said: ${transcribedText}`);

      // Remove timestamps from the transcribed text
      transcribedText = transcribedText.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]\s*/g, '');


      // 2. Send the transcribed text to the Ollama server via OllamaService
      const response = await ollamaService.generateChatCompletion({
        messages: [{ role: 'user', content: transcribedText }],
      });
      
      const ollamaResponse = response.data.message.content;
      console.log(`Ollama responded: ${ollamaResponse}`);

      return { transcription: transcribedText, response: ollamaResponse };
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw new Error('Error processing voice input');
    } finally {
      // Clean up the uploaded audio file
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
    }
  }
}

module.exports = new VoiceService();