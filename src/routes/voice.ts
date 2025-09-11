import { Router } from 'express';
import multer from 'multer';
import { VoiceController } from '../controllers/VoiceController';
import { rateLimitMiddleware, authenticateApiKey } from '../middleware/auth.middleware';
import { validate } from '../validators/schemas';
import { voiceSynthesisSchema } from '../validators/schemas';

const router = Router();
const voiceController = new VoiceController();

/**
 * Configure multer for audio file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/flac',
      'audio/ogg'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV, MP3, M4A, FLAC, and OGG audio files are allowed.'));
    }
  }
});

/**
 * Validation middleware factory
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 */
const validationMiddleware = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = validate(schema, req.body, req.correlationId);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @swagger
 * tags:
 *   - name: Voice
 *     description: Voice processing endpoints
 */

/**
 * @swagger
 * /api/voice/upload-audio:
 *   post:
 *     summary: Transcribe audio file
 *     description: Convert audio file to text using speech recognition
 *     tags: [Voice]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe (WAV, MP3, M4A, FLAC, OGG)
 *     responses:
 *       200:
 *         description: Audio transcribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transcription:
 *                       type: string
 *                       description: Transcribed text from audio
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       400:
 *         description: Bad request - Invalid file or missing file
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload-audio',
  rateLimitMiddleware,
  authenticateApiKey,
  upload.single('audio'),
  voiceController.transcribeAudio
);

/**
 * @swagger
 * /api/voice/process:
 *   post:
 *     summary: Process voice input
 *     description: Transcribe audio and generate AI response
 *     tags: [Voice]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to process (WAV, MP3, M4A, FLAC, OGG)
 *     responses:
 *       200:
 *         description: Voice processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transcription:
 *                       type: string
 *                       description: Transcribed text from audio
 *                     response:
 *                       type: string
 *                       description: AI response to the transcribed text
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       400:
 *         description: Bad request - Invalid file or missing file
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/process',
  rateLimitMiddleware,
  authenticateApiKey,
  upload.single('audio'),
  voiceController.processVoiceInput
);

/**
 * @swagger
 * /api/voice/synthesize:
 *   post:
 *     summary: Synthesize speech
 *     description: Convert text to speech
 *     tags: [Voice]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: Text to synthesize to speech
 *               model:
 *                 type: string
 *                 default: tts
 *                 description: TTS model name
 *               voice:
 *                 type: string
 *                 description: Voice to use for synthesis
 *               speed:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 3.0
 *                 default: 1.0
 *                 description: Speech speed
 *               pitch:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 3.0
 *                 default: 1.0
 *                 description: Speech pitch
 *     responses:
 *       200:
 *         description: Speech synthesized successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/synthesize',
  rateLimitMiddleware,
  authenticateApiKey,
  validationMiddleware(voiceSynthesisSchema),
  voiceController.synthesizeSpeech
);

/**
 * @swagger
 * /api/voice/formats:
 *   get:
 *     summary: Get supported audio formats
 *     description: Get list of supported audio file formats for voice processing
 *     tags: [Voice]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Supported formats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     extensions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Supported file extensions
 *                     mimeTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Supported MIME types
 *                     maxFileSize:
 *                       type: integer
 *                       description: Maximum file size in bytes
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  '/formats',
  rateLimitMiddleware,
  authenticateApiKey,
  voiceController.getSupportedFormats
);

export default router;
