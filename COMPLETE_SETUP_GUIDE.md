# Complete Setup Guide - Communication Round with Voice-to-Text

## 🎯 Current Status

Your voice-to-text feature is **almost working**! Here's what's happening:

✅ **Working:**
- Voice recording
- Speech-to-text transcription (Whisper API)
- Interview flow (Setup → Session → Results)
- Results display on separate page

❌ **Not Working:**
- Database missing columns (`communication_score`, `vocabulary_score`, `pronunciation_score`)

## 🔧 Final Fix Required

### **Step 1: Add Missing Database Columns**

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add missing columns to session_answers table
ALTER TABLE public.session_answers 
ADD COLUMN IF NOT EXISTS vocabulary_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS communication_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pronunciation_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_answers' 
  AND column_name IN ('vocabulary_score', 'communication_score', 'pronunciation_score')
ORDER BY column_name;
```

### **Step 2: Restart Backend Server**

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev:all
```

## 📋 Complete User Flow

### **For Students:**

1. **Login** → `http://localhost:8080/login`

2. **Go to Interview** → Click "Start Interview" or navigate to `/interview`

3. **Setup Page** (Interview Type Selection)
   - Select **"Communication Round"** (🎤 microphone icon)
   - Choose difficulty: Beginner / Intermediate / Advanced
   - Click **"Start Interview"**

4. **Session Page** (Answer Questions)
   - See question displayed
   - Toggle between **"Type"** or **"Voice"** input
   - For voice:
     - Click **"Start Recording"**
     - Speak clearly for 30-60 seconds
     - Click **"Stop Recording"**
     - Review transcription
     - Click **"Submit Answer"**
   - Repeat for all 5 questions

5. **Results Page** (Automatic Redirect)
   - After completing all questions, automatically redirected to results
   - See overall scores
   - View detailed analysis in tabs:
     - **Score Breakdown**: Individual question scores
     - **Answer Review**: Your transcribed answers
     - **AI Feedback**: Strengths and improvements
     - **Vocabulary Analysis**: Comprehensive communication assessment
   - Options:
     - **"Start New Interview"**: Go back to setup
     - **"Return to Dashboard"**: Go to main dashboard

## 🎤 Voice Recording Features

### **What Gets Analyzed:**

1. **Vocabulary Analysis**
   - Vocabulary score (0-100)
   - Word variety and complexity
   - Advanced vs basic words used
   - Technical terms identified
   - Proficiency level (beginner/intermediate/advanced)

2. **Communication Skills**
   - Fluency score
   - Clarity score
   - Coherence score
   - Sentence structure analysis
   - Filler word detection

3. **Professional Communication**
   - Formality score
   - Confidence indicators
   - Interview readiness score
   - Professional vocabulary usage

4. **Grammar Analysis**
   - Grammar accuracy score
   - Tense usage evaluation
   - Subject-verb agreement
   - Error identification

5. **Pronunciation Analysis**
   - Clarity score
   - Speaking pace assessment
   - Word stress evaluation
   - Potential mispronunciation detection

## 🔍 Troubleshooting

### **Issue: "No speech detected"**

**Solutions:**
1. Check microphone permissions in browser
2. Speak louder and more clearly
3. Ensure microphone is not muted
4. Try the simple voice test: `http://localhost:8080/voice-test`

### **Issue: "500 Internal Server Error"**

**Solutions:**
1. Check if database columns are added (see Step 1 above)
2. Check backend console for specific error messages
3. Verify both frontend (8080) and backend (3001) are running
4. Check if OpenAI API key is configured in `.env`

### **Issue: "Transcription failed"**

**Solutions:**
1. Check if OpenAI API key is valid
2. Check internet connection
3. Try recording shorter clips (30-60 seconds)
4. Use the simple voice test to verify microphone works

### **Issue: Results not showing**

**Solutions:**
1. Check browser console for errors
2. Verify session was completed successfully
3. Check if `session_answers` table has data
4. Try refreshing the page

## 📊 Database Tables

### **interview_sessions**
Stores interview session metadata:
- `id`: Session UUID
- `candidate_id`: User ID
- `interview_type`: 'communication' (or technical, behavioral, hr)
- `status`: 'in_progress' or 'completed'
- `difficulty_level`: 'beginner', 'intermediate', 'advanced'
- `score`: Overall session score
- `questions_answered`: Number of questions completed
- `total_questions`: Total questions (default: 5)

### **session_answers**
Stores individual question answers and analysis:
- `id`: Answer UUID
- `session_id`: Reference to interview_sessions
- `question_text`: The question asked
- `answer_text`: Transcribed speech or typed answer
- `overall_score`: Overall answer score (0-100)
- `vocabulary_score`: Vocabulary assessment (0-100)
- `communication_score`: Communication skills (0-100)
- `pronunciation_score`: Pronunciation clarity (0-100)
- `ai_feedback`: Detailed JSON feedback
- `time_taken_seconds`: Time to answer
- `word_count`: Number of words in answer

## 🚀 Testing Checklist

### **Before Testing:**
- [ ] Database columns added
- [ ] Backend server running (port 3001)
- [ ] Frontend server running (port 8080)
- [ ] OpenAI API key configured in `.env`
- [ ] Microphone permissions granted in browser

### **Test Flow:**
1. [ ] Login successfully
2. [ ] Navigate to interview page
3. [ ] Select "Communication Round"
4. [ ] Choose difficulty level
5. [ ] Start interview
6. [ ] Record voice answer
7. [ ] See transcription
8. [ ] Submit answer
9. [ ] Complete all 5 questions
10. [ ] See results page automatically
11. [ ] View vocabulary analysis tab
12. [ ] Check all scores display correctly

## 📝 API Endpoints

### **Interview Endpoints:**
- `POST /api/interview/start` - Start new interview session
- `POST /api/interview/next-question` - Get next question
- `POST /api/interview/submit-answer` - Submit text answer
- `POST /api/interview/submit-voice-answer` - Submit voice answer
- `POST /api/interview/complete` - Complete session
- `GET /api/interview/session/:id` - Get session results

### **Transcription Endpoints:**
- `POST /api/transcribe` - Convert audio to text (Whisper API)
- `POST /api/interview/analyze-voice` - Analyze voice transcription

## 🎯 Expected Results

After completing a communication interview, students should see:

### **Overall Scores:**
- Communication Score: 0-100
- Vocabulary Score: 0-100
- Pronunciation Score: 0-100
- Proficiency Level: Beginner/Intermediate/Advanced

### **Detailed Feedback:**
- Strengths (what they did well)
- Areas for improvement
- Specific recommendations
- Advanced words used
- Grammar issues identified
- Pronunciation feedback

### **Vocabulary Analysis Tab:**
- Word variety analysis
- Sentence structure breakdown
- Professional communication assessment
- Filler word detection
- Confidence indicators
- Personalized improvement suggestions

## 🔐 Security Notes

- Audio files are processed in memory, not stored permanently
- Transcriptions are stored securely in database
- Only the student can view their own results (RLS policies)
- OpenAI API key should be kept secret in `.env` file

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check backend terminal for error messages
3. Verify database schema is correct
4. Test with simple voice test first
5. Ensure all environment variables are set

---

**Once you add the missing database columns, everything should work perfectly!** The voice recording, transcription, and analysis are all functioning - just need the database to store the results properly.