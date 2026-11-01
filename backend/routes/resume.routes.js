import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import * as resumeService from '../services/resume.service.js';
import * as openaiService from '../services/openai.service.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Upload and process resume
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    console.log(`Processing resume for user: ${userId}, file: ${file.originalname}`);

    // 1. Extract text from resume
    const resumeText = await resumeService.extractResumeText(file.buffer, file.mimetype);

    // 2. Generate questions and extract profile details using OpenAI
    const [suggestedQuestions, extractedProfile] = await Promise.all([
      openaiService.generateResumeQuestions(resumeText),
      openaiService.extractProfileFromResume(resumeText)
    ]);

    // 3. Update user profile in Supabase
    const updateData = {
      resume_text: resumeText,
      suggested_questions: suggestedQuestions,
      updated_at: new Date().toISOString()
    };

    // If profile extraction was successful, add it to update data
    if (extractedProfile) {
      if (extractedProfile.skills) updateData.skills = extractedProfile.skills;
      if (extractedProfile.bio) updateData.bio = extractedProfile.bio;
      if (extractedProfile.job_title) updateData.job_title = extractedProfile.job_title;
      if (extractedProfile.experience_years) updateData.experience_years = extractedProfile.experience_years;
      if (extractedProfile.education) updateData.education = extractedProfile.education;
      if (extractedProfile.location) updateData.location = extractedProfile.location;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with resume data:', updateError);
      if (updateError.message.includes('column') || updateError.code === '42703') {
        return res.status(500).json({ 
          success: false, 
          error: 'Database columns missing. Please run the SQL migration at database/add_profile_fields.sql in your Supabase dashboard.' 
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Resume processed successfully. Your profile has been updated!',
      questions: suggestedQuestions,
      profile: extractedProfile
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Check if it is a client-side parsing error (e.g. invalid file format or corrupted structure)
    const isClientError = error.message.includes('parse') || 
                          error.message.includes('PDF') || 
                          error.message.includes('DOCX') || 
                          error.message.includes('type') ||
                          error.message.includes('structure');
                          
    res.status(isClientError ? 400 : 500).json({ 
      success: false, 
      error: error.message || 'Failed to process resume' 
    });
  }
});

/**
 * Get resume questions for a user
 */
router.get('/questions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('suggested_questions, resume_text')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      questions: data.suggested_questions || [],
      hasResume: !!data.resume_text
    });
  } catch (error) {
    console.error('Error fetching resume questions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch questions' });
  }
});

export default router;
