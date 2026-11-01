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

// Use gpt-3.5-turbo for faster responses (gpt-4 is slower but more accurate)
const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * Generate interview questions based on type and difficulty (MCQ format)
 */
export async function generateQuestion(type, difficulty, previousQuestions = [], previousAnswer = null, userSkills = []) {
  try {
    const prompt = `Generate a ${difficulty} level ${type} interview question in multiple choice format.
    
${userSkills && userSkills.length > 0 ? `The candidate has the following skills: ${userSkills.join(', ')}. Try to tailor the question to be relevant to these skills if applicable to ${type}.` : ''}

CRITICAL: Do NOT repeat any of the following questions that have already been asked: ${previousQuestions.join(', ') || 'None'}

${previousAnswer ? `IMPORTANT: The correct answer for the previous question was '${previousAnswer}'. To provide variety, try to make the correct answer for this new question a DIFFERENT letter (not ${previousAnswer}).` : ''}

Requirements:
- Make it unique and fundamentally different from previous questions
- Ensure the question covers a different topic or aspect of ${type} to maintain variety
- Appropriate for ${difficulty} level
- Relevant to ${type} interviews
- Include 4 options (A, B, C, D)
- Only ONE correct answer
- Randomize the correct answer among A, B, C, and D.
- Make distractors plausible but clearly wrong

Return in JSON format:
{
  "question": "the question text",
  "options": {
    "A": "option A text",
    "B": "option B text",
    "C": "option C text",
    "D": "option D text"
  },
  "correct_answer": "The correct letter (A, B, C, or D)",
  "explanation": "brief explanation of why this is correct"
}

NOTE: You MUST shuffle the correct answer position. Do not always make it A.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach who creates insightful multiple choice interview questions. You MUST respond with a JSON object. You MUST ensure the correct answer is randomly distributed among options A, B, C, and D. Every question you generate must be fresh and unique.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9, // Increased temperature for more variety
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();
    console.log('=== OpenAI MCQ Response ===');
    console.log(content);
    console.log('=========================');
    
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    const parsed = JSON.parse(jsonString);
    console.log('Parsed MCQ Data:', JSON.stringify(parsed, null, 2));
    
    return parsed;
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

/**
 * Analyze answer and provide comprehensive feedback
 */
export async function analyzeAnswer(question, answer, questionType, correctAnswer = null, explanation = null) {
  try {
    // For MCQ, provide immediate feedback
    if (correctAnswer) {
      const isCorrect = answer === correctAnswer;
      return {
        overall_score: isCorrect ? 100 : 0,
        tone_score: 100,
        sentiment_score: 100,
        confidence_score: isCorrect ? 100 : 50,
        fluency_score: 100,
        grammar_score: 100,
        star_score: null,
        feedback: {
          strengths: isCorrect 
            ? ["Accurate conceptual understanding.", "Correct identification of the key principle."]
            : [],
          improvements: isCorrect 
            ? []
            : [
                `The correct answer was option ${correctAnswer}.`, 
                explanation ? `Review the core concept: ${explanation}` : "Review the fundamental concepts associated with this specific question."
              ],
          tone_analysis: "MCQ Response",
          sentiment: isCorrect ? "positive" : "neutral",
          confidence_level: isCorrect ? "high" : "medium",
          grammar_issues: [],
          star_analysis: null,
        },
        keywords_found: [answer],
        keywords_missing: [],
        suggestions: [explanation || "Review the explanation for this question"],
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        explanation: explanation,
      };
    }

    // For text-based answers, use AI analysis
    const prompt = `Analyze this interview answer and provide detailed feedback.

Question: ${question}
Question Type: ${questionType}
Answer: ${answer}

Provide analysis in the following JSON format:
{
  "overall_score": <0-100>,
  "tone_score": <0-100>,
  "sentiment_score": <0-100>,
  "confidence_score": <0-100>,
  "fluency_score": <0-100>,
  "grammar_score": <0-100>,
  "star_score": <0-100 if behavioral, else null>,
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["Specific, actionable, and accurate improvement tip 1", "Specific, actionable, and accurate improvement tip 2"],
    "tone_analysis": "description of tone",
    "sentiment": "positive/neutral/negative",
    "confidence_level": "high/medium/low",
    "grammar_issues": ["issue1", "issue2"],
    "star_analysis": {
      "situation": <0-25>,
      "task": <0-25>,
      "action": <0-25>,
      "result": <0-25>,
      "feedback": "specific feedback"
    }
  },
  "keywords_found": ["keyword1", "keyword2"],
  "keywords_missing": ["missing1", "missing2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

IMPORTANT FEEDBACK RULES:
1. If the answer is correct or excellent (score > 85), the "improvements" array MUST be empty [], and only "strengths" should be provided.
2. If the answer is incorrect or needs major work (score < 60), the "strengths" array MUST be empty [], and only specific "improvements" should be provided.
3. For average answers (60-85), you may provide both, but keep them very concise.
4. If providing improvements, ensure they are specific, actionable, and ACCURATE to the context.
5. Be thorough and constructive in your analysis.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach providing detailed, constructive feedback on interview answers. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content.trim();
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error analyzing answer:', error);
    // Return a structured fallback to prevent UI crashes
    return {
      overall_score: 50,
      tone_score: 50,
      sentiment_score: 50,
      confidence_score: 50,
      fluency_score: 50,
      grammar_score: 50,
      star_score: null,
      feedback: {
        strengths: ["Attempted the question."],
        improvements: ["AI analysis was unavailable for this answer. Please try again."],
        tone_analysis: "Analysis Unavailable",
        sentiment: "neutral",
        confidence_level: "medium",
        grammar_issues: [],
        star_analysis: null
      },
      keywords_found: [],
      keywords_missing: [],
      suggestions: ["Review the question and your answer manually."]
    };
  }
}

/**
 * Generate personalized recommendations
 */
export async function generateRecommendations(userStats, weakAreas) {
  try {
    const prompt = `Based on the following user performance data, generate 3-5 personalized recommendations for improvement.

User Stats:
- Average Score: ${userStats.avgScore}
- Sessions Completed: ${userStats.sessionsCompleted}
- Weak Areas: ${weakAreas.join(', ')}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "recommendation title",
      "description": "detailed description",
      "priority": <1-5>,
      "category": "category name"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a career coach providing personalized interview preparation advice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Generate short preparation recommendations based on a single session's performance
 */
export async function generateSessionRecommendations(sessionScore, answers) {
  console.log('--- GENERATING SESSION RECOMMENDATIONS V3 ---');
  try {
    const weakAnswers = answers
      .filter(a => (a.overall_score || 0) < 70)
      .map(a => ({
        question: a.question_text,
        score: a.overall_score,
        feedback: a.ai_feedback?.improvements || []
      }));

    const prompt = `Based on the following interview session performance, generate 3-4 short, actionable preparation recommendations.

Session Overall Score: ${sessionScore}/100
Number of Questions: ${answers.length}
${weakAnswers.length > 0 
  ? `Areas needing improvement:\n${weakAnswers.map(a => `- Question: ${a.question}\n  Feedback: ${a.feedback.join(', ')}`).join('\n')}`
  : `The candidate performed exceptionally well. Focus on 'Level Up' recommendations to move from advanced to expert level.`
}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "short title",
      "description": "1-2 sentence actionable advice",
      "priority": <1-5>,
      "category": "e.g., Technical Depth, Communication Polish, Advanced Patterns"
    }
  ]
}

Keep it brief, actionable, and encouraging.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach providing quick, actionable advice for candidates. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonString);
    // Ensure we return an object with a recommendations array
    if (Array.isArray(parsed)) return { recommendations: parsed };
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) return parsed;
    return { recommendations: [parsed] };
  } catch (error) {
    console.error('Error generating session recommendations:', error);
    throw error;
  }
}

/**
 * Generate an overall session feedback summary
 */
export async function generateSessionFeedback(sessionScore, answers) {
  try {
    const prompt = `Provide a concise (2-3 sentences) overall feedback for an interview practice session.
    
Overall Score: ${sessionScore}/100
Number of Questions: ${answers.length}
Key performance metrics:
- Average Score: ${sessionScore}
- Strongest areas: ${answers.filter(a => a.overall_score >= 80).map(a => a.question_text.split(' ').slice(0, 3).join(' ')).join(', ') || 'None'}
- Areas to focus: ${answers.filter(a => a.overall_score < 70).map(a => a.question_text.split(' ').slice(0, 3).join(' ')).join(', ') || 'General improvement'}

Return as a simple JSON:
{
  "summary": "Your overall feedback text here..."
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an encouraging interview mentor. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonString);
    return parsed.summary ? parsed : { summary: typeof parsed === 'string' ? parsed : "Great effort on completing this interview session!" };
  } catch (error) {
    console.error('Error generating session feedback:', error);
    return { summary: "Great effort on completing this interview session! Review your individual answers for detailed feedback." };
  }
}

/**
 * Generate answer template
 */
export async function generateAnswerTemplate(questionType, userBackground = '') {
  try {
    const prompt = `Generate an answer template for a ${questionType} interview question.
    
${userBackground ? `User Background: ${userBackground}` : ''}

Provide a template with placeholders that the user can fill in.
Include tips for using the template effectively.

Return in JSON format:
{
  "template": "template text with [PLACEHOLDERS]",
  "placeholders": ["PLACEHOLDER1", "PLACEHOLDER2"],
  "example": "filled example",
  "tips": ["tip1", "tip2", "tip3"]
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an interview preparation expert creating helpful answer templates.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating template:', error);
    throw error;
  }
}

/**
 * Determine next difficulty level based on performance
 */
export function adaptDifficulty(currentDifficulty, score) {
  if (score >= 80 && currentDifficulty === 'beginner') {
    return 'intermediate';
  } else if (score >= 85 && currentDifficulty === 'intermediate') {
    return 'advanced';
  } else if (score < 60 && currentDifficulty === 'advanced') {
    return 'intermediate';
  } else if (score < 50 && currentDifficulty === 'intermediate') {
    return 'beginner';
  }
  return currentDifficulty;
}

/**
 * Generate interview preparation questions based on resume content
 */
export async function generateResumeQuestions(resumeText) {
  try {
    const prompt = `Analyze the following resume text and generate 5 targeted interview preparation questions that a hiring manager might ask based on this candidate's background.

Resume Text:
${resumeText.substring(0, 4000)}

Requirements:
- Generate 5 diverse questions (technical, behavioral, and role-specific)
- Each question should be challenging and directly related to the candidate's experience or skills
- For each question, provide a brief tip on how to answer it effectively

Return in JSON format:
{
  "questions": [
    {
      "id": "1",
      "question": "question text",
      "type": "technical/behavioral/role-specific",
      "tip": "brief tip on how to answer"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical recruiter and interview coach. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    const parsed = JSON.parse(jsonString);
    return parsed.questions || [];
  } catch (error) {
    console.error('Error generating resume questions:', error);
    return [];
  }
}

/**
 * Extract profile details from resume text
 */
export async function extractProfileFromResume(resumeText) {
  try {
    const prompt = `Analyze the following resume text and extract key professional details.
    
Resume Text:
${resumeText.substring(0, 4000)}

Requirements:
- Extract a list of technical and soft skills (max 15)
- Create a concise professional bio/summary (2-3 sentences)
- Identify the most recent or relevant job title
- Identify years of experience if possible (as an integer)
- Identify education background (most recent degree/university)
- Identify location (City, Country)

Return in JSON format:
{
  "skills": ["skill1", "skill2"],
  "bio": "concise bio here",
  "job_title": "most relevant job title",
  "experience_years": 5,
  "education": "Degree at University",
  "location": "City, Country"
}

IMPORTANT: If any field is not found, provide a reasonable default or empty string/null.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR assistant that extracts structured data from resumes. You must respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error extracting profile from resume:', error);
    return null;
  }
}

export default {
  generateQuestion,
  analyzeAnswer,
  generateRecommendations,
  generateSessionRecommendations,
  generateSessionFeedback,
  generateAnswerTemplate,
  generateResumeQuestions,
  extractProfileFromResume,
  adaptDifficulty,
};
