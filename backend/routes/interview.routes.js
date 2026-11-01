import express from 'express';
import { createClient } from '@supabase/supabase-js';
import openaiService from '../services/openai.service.js';
import vocabularyService from '../services/vocabulary.service.js';
import multer from 'multer';

const router = express.Router();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
});

// Start new interview session
router.post('/start', async (req, res) => {
  try {
    console.log('🏁 Start interview request body:', req.body);
    const { userId, interviewType, difficultyLevel } = req.body;

    if (!userId || !interviewType || !difficultyLevel) {
      console.error('❌ Error: Missing required fields in start session request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'userId, interviewType, and difficultyLevel are all required in the request body to start an interview session.' 
      });
    }

    // Set different question counts based on interview type
    const totalQuestions = interviewType === 'communication' ? 2 : 5;

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert([{
        candidate_id: userId,
        interview_type: interviewType,
        difficulty_level: difficultyLevel,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_questions: totalQuestions,
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, session: data });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get next question
router.post('/next-question', async (req, res) => {
  try {
    const { sessionId, currentDifficulty, interviewType, previousQuestions } = req.body;

    let question;

    // Determine if we should take a question from the database (e.g., the first question)
    const isFirstQuestion = !previousQuestions || previousQuestions.length === 0;

    // Generate communication-focused questions for communication rounds
    if (interviewType === 'communication') {
      try {
        // For communication, if it's the first question, we can try to find a behavioral one in DB
        // But the user's Question Bank is mainly MCQs. So for communication, we might stick to AI 
        // unless we want to pull a behavioral question as the first one.
        
        const commData = await vocabularyService.generateCommunicationQuestion(
          currentDifficulty,
          previousQuestions
        );
        
        question = {
          id: null,
          question_text: commData.question,
          question_type: 'communication',
          difficulty_level: currentDifficulty,
          is_ai_generated: true,
          focus_areas: commData.focus_areas,
          expected_vocabulary: commData.expected_vocabulary,
          evaluation_criteria: commData.evaluation_criteria,
          sample_answer_structure: commData.sample_answer_structure,
        };
      } catch (commError) {
        console.error('Communication AI failed:', commError.message);
        throw new Error('Communication AI Question Generation Failed: ' + commError.message);
      }
    } else {
      try {
        // Fetch user profile and skills early to decide on tailoring
        let userSkills = [];
        if (sessionId) {
          try {
            const { data: sessionData } = await supabase
              .from('interview_sessions')
              .select('candidate_id')
              .eq('id', sessionId)
              .single();

            if (sessionData) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('skills')
                .eq('id', sessionData.candidate_id)
                .single();
              
              if (profile && profile.skills) {
                userSkills = profile.skills;
              }
            }
          } catch (err) {
            console.error('Error fetching user skills for decision:', err.message);
          }
        }

        // HYBRID LOGIC: 
        // 1. If it's the first question AND the user has NO skills specified, try the Admin Question Bank
        // 2. If the user HAS skills, we prefer AI generation to ensure the questions are tailored to those skills
        if (isFirstQuestion && (!userSkills || userSkills.length === 0)) {
          console.log('Fetching first question from Admin Question Bank (no specific user skills)...');
          const { data: dbQuestions } = await supabase
            .from('questions')
            .select('*')
            .ilike('question_type', `%${interviewType}%`)
            .eq('is_active', true)
            .limit(50);

          if (dbQuestions && dbQuestions.length > 0) {
            const randomQ = dbQuestions[Math.floor(Math.random() * dbQuestions.length)];
            
            // Check if question has valid options, if not skip to AI generation
            const hasValidOptions = randomQ.options && 
                                   typeof randomQ.options === 'object' &&
                                   randomQ.options.A && 
                                   randomQ.options.A !== "Option A" &&
                                   randomQ.options.B &&
                                   randomQ.options.C &&
                                   randomQ.options.D;
            
            if (hasValidOptions) {
              question = {
                id: randomQ.id,
                question_text: randomQ.question_text,
                question_type: interviewType,
                difficulty_level: randomQ.difficulty_level || currentDifficulty,
                is_ai_generated: false,
                options: randomQ.options,
                correct_answer: randomQ.correct_answer || "A",
                explanation: randomQ.explanation || "Manual question from question bank.",
              };
              console.log('Selected question from DB:', question.question_text);
            } else {
              console.log('DB question has invalid options, falling back to AI generation');
            }
          }
        }

        // If no question was selected from DB (either not first question, DB was empty, or user has skills)
        if (!question) {
          // Get the last correct answer to avoid repetition if possible
          let previousAnswer = null;

          if (sessionId && previousQuestions.length > 0) {
            const { data: lastAnswer } = await supabase
              .from('session_answers')
              .select('ai_feedback')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (lastAnswer && lastAnswer.ai_feedback) {
              previousAnswer = lastAnswer.ai_feedback.correct_answer;
            }
          }

          // Generate MCQ questions with AI
          const mcqData = await openaiService.generateQuestion(
            interviewType,
            currentDifficulty,
            previousQuestions,
            previousAnswer,
            userSkills
          );
          
          question = {
            id: null,
            question_text: mcqData.question,
            question_type: interviewType,
            difficulty_level: currentDifficulty,
            is_ai_generated: true,
            options: mcqData.options,
            correct_answer: mcqData.correct_answer,
            explanation: mcqData.explanation,
          };
        }
      } catch (aiError) {
        console.error('Question generation failed:', aiError.message);
        throw new Error('Question Generation Failed: ' + aiError.message);
      }
    }

    console.log('Sending question to frontend:', JSON.stringify(question, null, 2));
    res.json({ success: true, question });
  } catch (error) {
    console.error('Error in /next-question route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit and analyze answer
router.post('/submit-answer', async (req, res) => {
  try {
    const { sessionId, questionId, questionText, answerText, timeTaken, questionType, correctAnswer, explanation } = req.body;

    // Analyze answer with AI (pass correctAnswer for MCQ)
    let analysis;
    try {
      analysis = await openaiService.analyzeAnswer(
        questionText,
        answerText,
        questionType,
        correctAnswer,
        explanation
      );
    } catch (aiError) {
      console.warn('AI analysis failed (likely quota), using basic fallback:', aiError.message);
      const isCorrect = correctAnswer ? answerText === correctAnswer : true;
      analysis = {
        overall_score: isCorrect ? 85 : 45,
        tone_score: 80,
        sentiment_score: 80,
        confidence_score: 80,
        fluency_score: 80,
        grammar_score: 80,
        star_score: null,
        feedback: {
          strengths: isCorrect ? ["Good effort on this question."] : [],
          improvements: isCorrect ? [] : ["Consider reviewing the core concept for this topic."],
          tone_analysis: "Neutral",
          sentiment: "neutral",
          confidence_level: "medium",
          grammar_issues: [],
          star_analysis: null,
        },
        keywords_found: [],
        keywords_missing: [],
        suggestions: ["AI feedback is currently unavailable due to high traffic. Your score is based on basic validation."],
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        explanation: explanation,
      };
    }

    // Calculate word count
    const wordCount = answerText.trim().split(/\s+/).length;

    // Store answer with AI feedback (include correct_answer and explanation for MCQ)
    const feedbackData = {
      ...analysis.feedback,
      correct_answer: analysis.correct_answer || correctAnswer,
      explanation: analysis.explanation || explanation,
      is_correct: analysis.is_correct,
    };

    // Try to insert into session_answers, fallback to session_questions if it fails
    let data, error;
    
    try {
      const result = await supabase
        .from('session_answers')
        .insert([{
          session_id: sessionId,
          question_id: questionId,
          question_text: questionText,
          answer_text: answerText,
          time_taken_seconds: timeTaken,
          word_count: wordCount,
          overall_score: analysis.overall_score,
          tone_score: analysis.tone_score,
          sentiment_score: analysis.sentiment_score,
          confidence_score: analysis.confidence_score,
          fluency_score: analysis.fluency_score,
          grammar_score: analysis.grammar_score,
          star_score: analysis.star_score,
          ai_feedback: feedbackData,
          keywords_found: analysis.keywords_found,
          keywords_missing: analysis.keywords_missing,
          grammar_issues: analysis.feedback?.grammar_issues || [],
          star_analysis: analysis.feedback?.star_analysis || null,
        }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } catch (sessionAnswersError) {
      console.log('session_answers table not available, using session_questions fallback');
      
      // Fallback to session_questions table
      const fallbackResult = await supabase
        .from('session_questions')
        .insert([{
          session_id: sessionId,
          question_id: questionId,
          candidate_answer: answerText,
          ai_feedback: JSON.stringify(feedbackData),
          score: analysis.overall_score,
          time_taken_seconds: timeTaken,
        }])
        .select()
        .single();
      
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    res.json({ success: true, answer: data, analysis });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete session
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Get all answers for this session
    let { data: answers, error: answersError } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', sessionId);

    // If session_answers is empty, try session_questions fallback
    if (!answers || answers.length === 0) {
      console.log('session_answers empty, checking session_questions fallback');
      const { data: fallbackAnswers, error: fallbackError } = await supabase
        .from('session_questions')
        .select('*')
        .eq('session_id', sessionId);
      
      if (!fallbackError && fallbackAnswers) {
        // Map fallback format to standard answer format
        // Try to fetch question texts for these questions
        const questionIds = fallbackAnswers.map(a => a.question_id).filter(Boolean);
        let questionMap = {};
        
        if (questionIds.length > 0) {
          const { data: questionTexts } = await supabase
            .from('questions')
            .select('id, question_text')
            .in('id', questionIds);
          
          if (questionTexts) {
            questionMap = questionTexts.reduce((acc, q) => ({ ...acc, [q.id]: q.question_text }), {});
          }
        }

        answers = fallbackAnswers.map(a => ({
          question_text: a.question_text || questionMap[a.question_id] || 'Question',
          overall_score: a.score || 0,
          ai_feedback: typeof a.ai_feedback === 'string' ? JSON.parse(a.ai_feedback) : a.ai_feedback,
          time_taken_seconds: a.time_taken_seconds || 0,
          word_count: a.answer_text ? a.answer_text.split(/\s+/).length : 0
        }));
      }
    }

    if (answersError && !answers) throw answersError;
    console.log(`Found ${answers?.length || 0} answers for session ${sessionId}`);

    // Calculate average score
    const avgScore = answers && answers.length > 0
      ? answers.reduce((acc, a) => acc + (Number(a.overall_score) || 0), 0) / answers.length
      : 0;

    // Generate session-specific recommendations and feedback
    let recommendations = [];
    let sessionFeedbackSummary = "Great effort on completing this interview session!";
    
    try {
      console.log('Generating session insights for score:', avgScore);
      const [recData, feedbackData] = await Promise.all([
        openaiService.generateSessionRecommendations(avgScore, answers),
        openaiService.generateSessionFeedback(avgScore, answers)
      ]);
      recommendations = recData.recommendations;
      sessionFeedbackSummary = feedbackData.summary;
      console.log('Successfully generated session insights');
    } catch (recError) {
      console.error('CRITICAL ERROR generating session insights:', recError.message);
      // Fallback recommendations
      recommendations = [
        {
          title: "Practice Makes Perfect",
          description: "Continue practicing across different topics to broaden your knowledge.",
          priority: 3,
          category: "General Practice"
        },
        {
          title: "Review Fundamentals",
          description: "Focus on core concepts for any questions where you scored lower.",
          priority: 4,
          category: "Fundamentals"
        }
      ];
    }

    // Update session with score, status, feedback and recommendations
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score: avgScore,
        questions_answered: answers?.length || 0,
        feedback: sessionFeedbackSummary,
        session_data: { 
          recommendations: recommendations 
        }
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Store recommendations if any
    if (recommendations.length > 0) {
      const recsToInsert = recommendations.map(rec => ({
        user_id: session.candidate_id,
        session_id: sessionId,
        recommendation_type: 'session_improvement',
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        category: rec.category,
      }));

      // We use try-catch here because session_id column might not exist yet if migration wasn't run
      try {
        await supabase.from('recommendations').insert(recsToInsert);
      } catch (insertError) {
        console.error('Error inserting recommendations (maybe session_id missing?):', insertError);
        // Fallback: insert without session_id
        const fallbackRecs = recsToInsert.map(({ session_id, ...rest }) => rest);
        await supabase.from('recommendations').insert(fallbackRecs);
      }
    }

    res.json({ 
      success: true, 
      session, 
      recommendations 
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session details
router.get('/session/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;

    let { data: answers, error: answersError } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    // Fallback if session_answers is empty
    if (!answers || answers.length === 0) {
      const { data: fallbackAnswers } = await supabase
        .from('session_questions')
        .select('*')
        .eq('session_id', id);
      
      if (fallbackAnswers) {
        answers = fallbackAnswers.map(a => ({
          ...a,
          overall_score: a.score,
          ai_feedback: typeof a.ai_feedback === 'string' ? JSON.parse(a.ai_feedback) : a.ai_feedback
        }));
      }
    }

    if (answersError) throw answersError;

    // Fetch recommendations for this session
    // First check session_data, then fallback to recommendations table
    let recommendations = session.session_data?.recommendations || [];
    
    if (recommendations.length === 0) {
      const { data: recsFromTable } = await supabase
        .from('recommendations')
        .select('*')
        .eq('session_id', id);
      recommendations = recsFromTable || [];
    }

    res.json({ 
      success: true, 
      session, 
      answers,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, userStats, weakAreas } = req.body;

    const recommendations = await openaiService.generateRecommendations(
      userStats,
      weakAreas
    );

    // Store recommendations in database
    const recsToInsert = recommendations.recommendations.map(rec => ({
      user_id: userId,
      recommendation_type: 'improvement',
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      category: rec.category,
    }));

    const { error } = await supabase
      .from('recommendations')
      .insert(recsToInsert);

    if (error) throw error;

    res.json({ success: true, recommendations: recommendations.recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze voice transcription for vocabulary and communication
router.post('/analyze-voice', async (req, res) => {
  try {
    const { sessionId, transcription, questionText, questionType, difficulty, expectedVocabulary } = req.body;

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({ error: 'Transcription is required' });
    }

    // Comprehensive vocabulary and communication analysis
    const vocabAnalysis = await vocabularyService.analyzeVocabularyAndCommunication(
      transcription,
      questionType,
      difficulty
    );

    // Pronunciation analysis
    const pronunciationAnalysis = await vocabularyService.analyzePronunciation(
      transcription,
      expectedVocabulary || []
    );

    // Combine analyses
    const combinedAnalysis = {
      ...vocabAnalysis,
      pronunciation_analysis: pronunciationAnalysis.pronunciation_analysis,
      transcription_text: transcription,
      analysis_timestamp: new Date().toISOString(),
    };

    // Calculate overall communication score
    const communicationScore = Math.round(
      (vocabAnalysis.vocabulary_analysis.vocabulary_score * 0.3 +
       vocabAnalysis.communication_analysis.fluency_score * 0.25 +
       vocabAnalysis.communication_analysis.clarity_score * 0.25 +
       vocabAnalysis.professional_communication.interview_readiness_score * 0.2) 
    );

    res.json({ 
      success: true, 
      analysis: combinedAnalysis,
      overall_score: communicationScore,
      transcription: transcription
    });
  } catch (error) {
    console.error('Error analyzing voice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit voice-based answer with comprehensive analysis
router.post('/submit-voice-answer', async (req, res) => {
  try {
    const { 
      sessionId, 
      questionId, 
      questionText, 
      transcription, 
      timeTaken, 
      questionType, 
      expectedVocabulary,
      difficulty 
    } = req.body;

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({ error: 'Transcription is required' });
    }

    // Comprehensive analysis
    const vocabAnalysis = await vocabularyService.analyzeVocabularyAndCommunication(
      transcription,
      questionType,
      difficulty
    );

    const pronunciationAnalysis = await vocabularyService.analyzePronunciation(
      transcription,
      expectedVocabulary || []
    );

    // Calculate scores
    const overallScore = vocabAnalysis.overall_assessment.communication_score;
    const wordCount = vocabAnalysis.vocabulary_analysis.word_count;

    // Prepare comprehensive feedback
    const comprehensiveFeedback = {
      vocabulary_analysis: vocabAnalysis.vocabulary_analysis,
      communication_analysis: vocabAnalysis.communication_analysis,
      professional_communication: vocabAnalysis.professional_communication,
      grammar_analysis: vocabAnalysis.grammar_analysis,
      pronunciation_analysis: pronunciationAnalysis.pronunciation_analysis,
      overall_assessment: vocabAnalysis.overall_assessment,
      detailed_feedback: vocabAnalysis.detailed_feedback,
      transcription_text: transcription,
    };

    // Store answer with comprehensive analysis
    const { data, error } = await supabase
      .from('session_answers')
      .insert([{
        session_id: sessionId,
        question_id: questionId,
        question_text: questionText,
        answer_text: transcription,
        time_taken_seconds: timeTaken,
        word_count: wordCount,
        overall_score: overallScore,
        tone_score: vocabAnalysis.communication_analysis.fluency_score,
        sentiment_score: vocabAnalysis.communication_analysis.clarity_score,
        confidence_score: vocabAnalysis.professional_communication.interview_readiness_score,
        fluency_score: vocabAnalysis.communication_analysis.fluency_score,
        grammar_score: vocabAnalysis.grammar_analysis.grammar_score,
        star_score: null, // Not applicable for communication rounds
        ai_feedback: comprehensiveFeedback,
        keywords_found: vocabAnalysis.vocabulary_analysis.advanced_words,
        keywords_missing: [], // Could be enhanced based on expected vocabulary
        grammar_issues: vocabAnalysis.grammar_analysis.potential_errors || [],
        star_analysis: null,
        // Additional fields for voice analysis
        vocabulary_score: vocabAnalysis.vocabulary_analysis.vocabulary_score,
        communication_score: overallScore,
        pronunciation_score: pronunciationAnalysis.pronunciation_analysis.clarity_score,
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      answer: data, 
      analysis: {
        overall_score: overallScore,
        vocabulary_analysis: vocabAnalysis.vocabulary_analysis,
        communication_analysis: vocabAnalysis.communication_analysis,
        feedback: vocabAnalysis.detailed_feedback,
      }
    });
  } catch (error) {
    console.error('Error submitting voice answer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate vocabulary improvement exercises
router.post('/vocabulary-exercises', async (req, res) => {
  try {
    const { userId, weakAreas, currentLevel } = req.body;

    const exercises = await vocabularyService.generateVocabularyExercises(
      weakAreas || [],
      currentLevel || 'intermediate'
    );

    res.json({ success: true, exercises });
  } catch (error) {
    console.error('Error generating vocabulary exercises:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
