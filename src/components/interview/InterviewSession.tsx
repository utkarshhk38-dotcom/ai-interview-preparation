import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";
import VoiceRecorder from "./VoiceRecorder";
import { 
  Clock, 
  Send, 
  SkipForward,
  AlertCircle,
  Lightbulb,
  Mic,
  Type,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface Question {
  id: string | null;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  is_ai_generated?: boolean;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer?: string;
  explanation?: string;
  // Communication-specific fields
  focus_areas?: string[];
  expected_vocabulary?: string[];
  evaluation_criteria?: {
    vocabulary_usage: string;
    communication_clarity: string;
    professional_language: string;
  };
  sample_answer_structure?: string;
}

interface InterviewSessionProps {
  sessionId: string;
  interviewType: string;
  difficulty: string;
  onComplete: (sessionId: string) => void;
}

const InterviewSession = ({ sessionId, interviewType, difficulty, onComplete }: InterviewSessionProps) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(interviewType === 'communication' ? 2 : 5);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);
  const [useVoiceInput, setUseVoiceInput] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctOption, setCorrectOption] = useState<string | null>(null);
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - questionStartTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [questionStartTime]);

  // Load first question or resume session
  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      try {
        // If we have a sessionId, check if there are existing answers to resume
        if (sessionId) {
          const response = await fetch(getApiUrl(`/api/interview/session/${sessionId}`));
          const data = await response.json();
          if (data.success && data.answers && data.answers.length > 0) {
            setQuestionNumber(data.answers.length + 1);
            setPreviousQuestions(data.answers.map((a: any) => a.question_text));
            
            // Check if we finished all questions but status was still pending
            if (data.answers.length >= totalQuestions) {
              completeSession();
              return;
            }
          }
        }
        await loadNextQuestion();
      } catch (error) {
        console.error("Error resuming session:", error);
        await loadNextQuestion();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [sessionId]);

  const loadNextQuestion = async (updatedQuestions?: string[]) => {
    setLoading(true);
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(getApiUrl('/api/interview/next-question'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          currentDifficulty,
          interviewType,
          previousQuestions: updatedQuestions || previousQuestions,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new Error("AI services are currently busy due to high demand. Please try again in a few minutes.");
      }

      const data = await response.json();
      
      console.log('Received question data:', data);
      
      if (data.success && data.question) {
        console.log('Question successfully loaded:', data.question.question_text);
        setCurrentQuestion(data.question);
        setQuestionStartTime(Date.now());
        setTimeElapsed(0);
      } else {
        throw new Error(data.error || "Question data is missing from server response");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The question is taking too long to load. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: error.message.includes("AI services") ? "Rate Limited" : "Error",
          description: error.message || "Failed to load question",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const finalAnswer = useVoiceInput ? voiceTranscription : answer;
    
    if (!finalAnswer.trim()) {
      toast({
        title: "Please provide an answer",
        description: useVoiceInput ? "Please record your answer first." : "You need to write an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      
      // Use different endpoints for voice vs text answers
      const endpoint = useVoiceInput && interviewType === 'communication' 
        ? getApiUrl('/api/interview/submit-voice-answer')
        : getApiUrl('/api/interview/submit-answer');
      
      const requestBody = useVoiceInput && interviewType === 'communication' 
        ? {
            sessionId,
            questionId: currentQuestion?.id,
            questionText: currentQuestion?.question_text,
            transcription: voiceTranscription,
            timeTaken,
            questionType: interviewType,
            expectedVocabulary: currentQuestion?.expected_vocabulary || [],
            difficulty: currentDifficulty,
          }
        : {
            sessionId,
            questionId: currentQuestion?.id,
            questionText: currentQuestion?.question_text,
            answerText: finalAnswer,
            timeTaken,
            questionType: interviewType,
            correctAnswer: currentQuestion?.correct_answer,
            explanation: currentQuestion?.explanation,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success) {
        // Handle visual feedback
        setShowFeedback(true);
        const correct = data.analysis?.is_correct;
        setIsCorrect(correct);
        setCorrectOption(data.analysis?.correct_answer || currentQuestion?.correct_answer || null);

        // Add current question to previous questions
        let newQuestionsList = previousQuestions;
        if (currentQuestion?.question_text) {
          newQuestionsList = [...previousQuestions, currentQuestion.question_text];
          setPreviousQuestions(newQuestionsList);
        }

        // Adapt difficulty based on score
        if (data.analysis?.overall_score) {
          const newDifficulty = adaptDifficulty(currentDifficulty, data.analysis.overall_score);
          setCurrentDifficulty(newDifficulty);
        }

        // Show appropriate feedback toast
        toast({
          title: correct ? "Correct! ✓" : "Incorrect ✗",
          description: "Your answer has been recorded.",
          variant: correct ? "default" : "destructive",
        });

        // Wait before moving to next question
        setTimeout(() => {
          setShowFeedback(false);
          setIsCorrect(null);
          setCorrectOption(null);

          if (questionNumber >= totalQuestions) {
            completeSession();
          } else {
            setQuestionNumber(prev => prev + 1);
            setAnswer("");
            setVoiceTranscription("");
            setAudioBlob(null);
            loadNextQuestion(newQuestionsList);
          }
        }, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit answer",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completeSession = async () => {
    console.log('completeSession called with sessionId:', sessionId);
    
    setLoading(true);
    try {
      // Create abort controller for timeout (60s for completion as it generates recommendations)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(getApiUrl('/api/interview/complete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('Complete session response:', data);
      
      if (data.success) {
        console.log('Session completed successfully, calling onComplete...');
        onComplete(sessionId);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error completing session:', error);
      
      if (error.name === 'AbortError') {
        // If timeout, still try to navigate to results
        toast({
          title: "Processing Taking Longer",
          description: "Attempting to show your results...",
        });
        onComplete(sessionId); // Try to show results anyway
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to complete session. Showing partial results...",
          variant: "destructive",
        });
        // Still try to navigate to results page
        onComplete(sessionId);
      }
    } finally {
      setLoading(false);
    }
  };

  const adaptDifficulty = (current: string, score: number) => {
    if (score >= 80 && current === 'beginner') return 'intermediate';
    if (score >= 85 && current === 'intermediate') return 'advanced';
    if (score < 60 && current === 'advanced') return 'intermediate';
    if (score < 50 && current === 'intermediate') return 'beginner';
    return current;
  };

  const handleVoiceTranscription = (transcription: string, audioBlob: Blob) => {
    setVoiceTranscription(transcription);
    setAudioBlob(audioBlob);
    setAnswer(transcription); // Also set as regular answer for consistency
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (questionNumber / totalQuestions) * 100;
  const isMCQ = currentQuestion?.options !== undefined;
  const isCommunication = interviewType === 'communication';
  const hasAnswer = useVoiceInput ? voiceTranscription.trim() : answer.trim();

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your first question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => {
          if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
            navigate('/dashboard');
          }
        }}
        className="mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        Exit Interview
      </Button>

      {/* Progress Header */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Question {questionNumber} of {totalQuestions}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {interviewType} • {currentDifficulty} level
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(timeElapsed)}
              </div>
              {currentDifficulty !== difficulty && (
                <div className="flex items-center gap-1 text-primary">
                  <AlertCircle className="w-4 h-4" />
                  Difficulty adapted to {currentDifficulty}
                </div>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-start gap-3">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-primary-foreground">{questionNumber}</span>
            </div>
            <div className="flex-1">
              {currentQuestion?.question_text}
              {currentQuestion?.is_ai_generated && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <Lightbulb className="w-3 h-3" />
                  AI-generated question
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Communication Question Info */}
            {isCommunication && currentQuestion?.focus_areas && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h5 className="font-medium text-primary mb-2">Focus Areas:</h5>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentQuestion.focus_areas.map((area, index) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
                {currentQuestion.expected_vocabulary && currentQuestion.expected_vocabulary.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Try to use these vocabulary words:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentQuestion.expected_vocabulary.map((word, index) => (
                        <span key={index} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Method Toggle for Communication Questions */}
            {isCommunication && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Answer method:</span>
                <Button
                  variant={useVoiceInput ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setUseVoiceInput(false);
                    setVoiceTranscription("");
                    setAudioBlob(null);
                  }}
                  disabled={submitting}
                >
                  <Type className="w-4 h-4 mr-1" />
                  Type
                </Button>
                <Button
                  variant={useVoiceInput ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseVoiceInput(true);
                    setAnswer("");
                  }}
                  disabled={submitting}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  Voice
                </Button>
              </div>
            )}

            {/* Answer Input */}
            {isMCQ && currentQuestion?.options ? (
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = answer === key;
                  const isCorrectAnswer = correctOption === key;
                  
                  let buttonStyles = "border-border hover:border-primary/50";
                  if (isSelected) buttonStyles = "border-primary bg-primary/10 shadow-md";
                  
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      buttonStyles = "border-green-500 bg-green-50 shadow-md scale-[1.02]";
                    } else if (isSelected && !isCorrect) {
                      buttonStyles = "border-red-500 bg-red-50 shadow-md";
                    } else if (!isSelected) {
                      buttonStyles = "border-border opacity-50";
                    }
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`w-full p-4 text-left border-2 rounded-lg transition-all hover:shadow-md relative overflow-hidden ${buttonStyles}`}
                      onClick={() => setAnswer(key)}
                      disabled={submitting || showFeedback}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-colors ${
                          showFeedback && isCorrectAnswer
                            ? 'bg-green-500 text-white'
                            : showFeedback && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {key}
                        </div>
                        <span className="flex-1 pt-1">{value}</span>
                        
                        {showFeedback && isCorrectAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-500 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : useVoiceInput && isCommunication ? (
              <VoiceRecorder
                onTranscriptionComplete={handleVoiceTranscription}
                disabled={submitting}
                maxDuration={300} // 5 minutes
              />
            ) : (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={isCommunication 
                  ? "Type your answer here... Focus on clear communication and use relevant vocabulary."
                  : "Type your answer here... Be specific and provide examples when possible."
                }
                className="min-h-[200px] resize-none"
                disabled={submitting}
              />
            )}

            <div className="flex gap-3">
              <Button
                onClick={submitAnswer}
                disabled={!hasAnswer || submitting}
                variant="hero"
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    {useVoiceInput && isCommunication ? 'Analyzing Speech...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
              
              {questionNumber < totalQuestions && (
                <Button
                  onClick={() => {
                    setAnswer("");
                    setVoiceTranscription("");
                    setAudioBlob(null);
                    setQuestionNumber(prev => prev + 1);
                    loadNextQuestion();
                  }}
                  variant="outline"
                  disabled={submitting}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">
                {isMCQ ? 'Tips for MCQ questions:' : 'Tips for a great answer:'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {isMCQ ? (
                  <>
                    <li>• Read all options carefully before selecting</li>
                    <li>• Eliminate obviously wrong answers first</li>
                    <li>• Look for keywords in the question</li>
                    <li>• Trust your first instinct if unsure</li>
                  </>
                ) : (
                  <>
                    <li>• Be specific and provide concrete examples</li>
                    <li>• Use the STAR method for behavioral questions</li>
                    <li>• Quantify your achievements when possible</li>
                    <li>• Keep your answer focused and relevant</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewSession;
