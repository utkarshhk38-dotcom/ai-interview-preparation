import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * Comprehensive vocabulary and communication analysis
 */
export async function analyzeVocabularyAndCommunication(transcription, questionType, difficulty) {
  try {
    const prompt = `Analyze this spoken response for vocabulary, communication skills, and overall language proficiency.

Transcription: "${transcription}"
Question Type: ${questionType}
Difficulty Level: ${difficulty}

Provide a comprehensive analysis in JSON format:
{
  "vocabulary_analysis": {
    "vocabulary_score": <0-100>,
    "word_count": <number>,
    "unique_words": <number>,
    "advanced_words": ["word1", "word2"],
    "basic_words": ["word1", "word2"],
    "technical_terms": ["term1", "term2"],
    "vocabulary_level": "basic/intermediate/advanced",
    "word_variety_score": <0-100>
  },
  "communication_analysis": {
    "fluency_score": <0-100>,
    "clarity_score": <0-100>,
    "coherence_score": <0-100>,
    "pronunciation_indicators": {
      "filler_words": ["um", "uh", "like"],
      "repetitions": ["repeated phrase"],
      "hesitations": <count>
    },
    "sentence_structure": {
      "simple_sentences": <count>,
      "complex_sentences": <count>,
      "sentence_variety_score": <0-100>
    }
  },
  "professional_communication": {
    "formality_score": <0-100>,
    "confidence_indicators": ["indicator1", "indicator2"],
    "professional_vocabulary": ["term1", "term2"],
    "interview_readiness_score": <0-100>
  },
  "grammar_analysis": {
    "grammar_score": <0-100>,
    "tense_usage": "correct/incorrect/mixed",
    "subject_verb_agreement": "correct/incorrect",
    "potential_errors": ["error1", "error2"]
  },
  "overall_assessment": {
    "communication_score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"],
    "recommendations": ["rec1", "rec2"],
    "proficiency_level": "beginner/intermediate/advanced"
  },
  "detailed_feedback": {
    "vocabulary_feedback": "detailed feedback on vocabulary usage",
    "communication_feedback": "detailed feedback on communication skills",
    "improvement_suggestions": ["suggestion1", "suggestion2"]
  }
}

Be thorough and provide actionable feedback for interview preparation.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert communication coach and linguist specializing in interview preparation and vocabulary assessment. Provide detailed, constructive analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error analyzing vocabulary and communication:', error);
    // Return a structured fallback that matches VocabularyAnalysisProps
    return {
      vocabulary_analysis: {
        vocabulary_score: 50,
        word_count: transcription.split(' ').length,
        unique_words: new Set(transcription.split(' ')).size,
        advanced_words: [],
        basic_words: [],
        technical_terms: [],
        vocabulary_level: "Intermediate",
        word_variety_score: 50
      },
      communication_analysis: {
        fluency_score: 50,
        clarity_score: 50,
        coherence_score: 50,
        pronunciation_indicators: {
          filler_words: [],
          repetitions: [],
          hesitations: 0
        },
        sentence_structure: {
          simple_sentences: 0,
          complex_sentences: 0,
          sentence_variety_score: 50
        }
      },
      professional_communication: {
        formality_score: 50,
        confidence_indicators: [],
        professional_vocabulary: [],
        interview_readiness_score: 50
      },
      grammar_analysis: {
        grammar_score: 50,
        tense_usage: "Mixed",
        subject_verb_agreement: "Correct",
        potential_errors: []
      },
      overall_assessment: {
        communication_score: 50,
        strengths: ["Successfully recorded an answer."],
        areas_for_improvement: ["AI analysis was partially limited."],
        recommendations: ["Focus on speaking clearly and at a steady pace."],
        proficiency_level: "Intermediate"
      },
      detailed_feedback: {
        vocabulary_feedback: "Vocabulary analysis was unavailable. Try to use more technical terms in your next answer.",
        communication_feedback: "Communication analysis was unavailable. Focus on your clarity and fluency.",
        improvement_suggestions: ["Practice common interview questions to build confidence."]
      }
    };
  }
}

/**
 * Generate vocabulary improvement exercises
 */
export async function generateVocabularyExercises(weakAreas, currentLevel) {
  try {
    const prompt = `Generate personalized vocabulary improvement exercises based on the following analysis:

Weak Areas: ${weakAreas.join(', ')}
Current Level: ${currentLevel}

Create 5 targeted exercises in JSON format:
{
  "exercises": [
    {
      "type": "synonym_practice",
      "title": "exercise title",
      "description": "exercise description",
      "words": ["word1", "word2", "word3"],
      "difficulty": "beginner/intermediate/advanced",
      "instructions": "step by step instructions"
    },
    {
      "type": "context_usage",
      "title": "exercise title",
      "description": "exercise description",
      "scenarios": ["scenario1", "scenario2"],
      "target_words": ["word1", "word2"],
      "difficulty": "beginner/intermediate/advanced",
      "instructions": "step by step instructions"
    }
  ],
  "study_plan": {
    "daily_goals": ["goal1", "goal2"],
    "weekly_targets": ["target1", "target2"],
    "resources": ["resource1", "resource2"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a vocabulary coach creating personalized learning exercises for interview preparation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error generating vocabulary exercises:', error);
    throw error;
  }
}

/**
 * Analyze pronunciation patterns from transcription
 */
export async function analyzePronunciation(transcription, expectedWords = []) {
  try {
    const prompt = `Analyze this transcription for pronunciation patterns and potential issues:

Transcription: "${transcription}"
Expected Key Words: ${expectedWords.join(', ')}

Identify potential pronunciation issues based on common transcription patterns:
{
  "pronunciation_analysis": {
    "clarity_score": <0-100>,
    "potential_mispronunciations": [
      {
        "word": "transcribed_word",
        "likely_intended": "intended_word",
        "confidence": <0-100>
      }
    ],
    "speech_patterns": {
      "speaking_pace": "too_fast/normal/too_slow",
      "word_stress": "correct/needs_improvement",
      "intonation": "monotone/varied/appropriate"
    },
    "recommendations": [
      "Practice speaking more slowly",
      "Focus on word stress patterns"
    ]
  }
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a speech pathologist and pronunciation coach analyzing transcribed speech patterns.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error analyzing pronunciation:', error);
    throw error;
  }
}

/**
 * Generate communication-focused interview questions
 */
export async function generateCommunicationQuestion(difficulty, previousQuestions = []) {
  try {
    const prompt = `Generate a ${difficulty} level communication-focused interview question designed to assess vocabulary and speaking skills.

Previous questions: ${previousQuestions.join(', ') || 'None'}

The question should:
- Encourage rich vocabulary usage
- Allow for demonstration of communication skills
- Be appropriate for ${difficulty} level
- Be different from previous questions

Return in JSON format:
{
  "question": "the question text",
  "type": "communication",
  "focus_areas": ["vocabulary", "fluency", "clarity"],
  "expected_vocabulary": ["word1", "word2", "word3"],
  "evaluation_criteria": {
    "vocabulary_usage": "what to look for",
    "communication_clarity": "what to assess",
    "professional_language": "expectations"
  },
  "sample_answer_structure": "suggested structure for a good answer"
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an interview coach specializing in communication assessment questions. Every question you generate must be fresh, unique, and challenging.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error generating communication question:', error);
    throw error;
  }
}

export default {
  analyzeVocabularyAndCommunication,
  generateVocabularyExercises,
  analyzePronunciation,
  generateCommunicationQuestion,
};