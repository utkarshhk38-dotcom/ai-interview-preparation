import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/m4a'
    ];
    
    // Extract base MIME type (e.g., 'audio/webm' from 'audio/webm;codecs=opus')
    const baseMimetype = file.mimetype.split(';')[0].trim().toLowerCase();
    
    if (allowedTypes.includes(baseMimetype) || file.mimetype.toLowerCase().startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
    }
  },
});

// Transcribe audio using OpenAI Whisper
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Transcribing audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Create a File object from the buffer using OpenAI's toFile utility
    const audioFile = await OpenAI.toFile(req.file.buffer, req.file.originalname, {
      type: req.file.mimetype,
    });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent results
    });

    console.log('Transcription result:', transcription.text);

    res.json({
      success: true,
      text: transcription.text,
      duration: req.body.duration || null,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error.code === 'invalid_request_error') {
      return res.status(400).json({ 
        error: 'Invalid audio file or format not supported',
        details: error.message 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message 
    });
  }
});

// Health check endpoint for transcription service
router.get('/transcription-health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Transcription service is running',
    whisper_available: !!process.env.OPENAI_API_KEY
  });
});

export default router;