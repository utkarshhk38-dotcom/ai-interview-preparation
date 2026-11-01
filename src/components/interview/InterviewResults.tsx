import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VocabularyAnalysis from "./VocabularyAnalysis";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  MessageSquare,
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Volume2,
  User,
  Home
} from "lucide-react";

interface Answer {
  id: string;
  question_text: string;
  answer_text: string;
  overall_score: number;
  tone_score: number;
  sentiment_score: number;
  confidence_score: number;
  fluency_score: number;
  grammar_score: number;
  star_score: number | null;
  ai_feedback: any;
  keywords_found: string[];
  keywords_missing: string[];
  time_taken_seconds: number;
  word_count: number;
  vocabulary_score?: number;
  communication_score?: number;
  pronunciation_score?: number;
}

interface Session {
  id: string;
  interview_type: string;
  difficulty_level: string;
  score: number;
  questions_answered: number;
  feedback?: string;
  created_at: string;
  completed_at: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: number;
  category: string;
}

interface InterviewResultsProps {
  sessionId: string;
  userRole?: string;
  onReturnHome: () => void;
  onStartNew: () => void;
}

const InterviewResults = ({ sessionId, userRole, onReturnHome, onStartNew }: InterviewResultsProps) => {
  const { toast } = useToast();
  const isAdmin = userRole === 'admin';
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(getApiUrl(`/api/interview/session/${sessionId}`), {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched session results:', data.session);
        console.log('Fetched recommendations:', data.recommendations);
        setSession(data.session);
        setAnswers(data.answers);
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch results');
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      
      // Show error toast but don't block the UI
      if (error.name === 'AbortError') {
        toast({
          title: "Loading Timeout",
          description: "Results are taking longer than expected. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Loading Results",
          description: "Some results may be incomplete. Please refresh to try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 80) return { label: "Good", variant: "secondary" as const };
    if (score >= 60) return { label: "Average", variant: "outline" as const };
    return { label: "Needs Improvement", variant: "destructive" as const };
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Session not found</p>
        <Button onClick={onReturnHome}>Return Home</Button>
      </div>
    );
  }

  const overallScore = session.score || 0;
  const totalTime = answers.reduce((acc, answer) => acc + answer.time_taken_seconds, 0);
  const avgWordsPerAnswer = answers.length > 0 
    ? Math.round(answers.reduce((acc, answer) => acc + (answer.word_count || 0), 0) / answers.length)
    : 0;
  const isCommunicationInterview = session.interview_type === 'communication';
  
  // Calculate communication-specific metrics
  const avgVocabularyScore = isCommunicationInterview && answers.length > 0
    ? Math.round(answers.reduce((acc, answer) => acc + (answer.vocabulary_score || 0), 0) / answers.length)
    : null;
  
  const avgCommunicationScore = isCommunicationInterview && answers.length > 0
    ? Math.round(answers.reduce((acc, answer) => acc + (answer.communication_score || answer.overall_score), 0) / answers.length)
    : null;
  
  const avgPronunciationScore = isCommunicationInterview && answers.length > 0
    ? Math.round(answers.reduce((acc, answer) => acc + (answer.pronunciation_score || 0), 0) / answers.length)
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          {isAdmin ? (
            <User className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Trophy className="w-8 h-8 text-primary-foreground" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {isAdmin ? 'Candidate Evaluation Report' : 'Interview Complete!'}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isAdmin 
            ? `Reviewing the ${session.interview_type} interview performance for candidate ${session.id.split('-')[0]}...` 
            : `Great job completing your ${session.interview_type} interview practice session.`}
        </p>
        {isAdmin && (
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
             <Badge variant="outline" className="bg-primary/5">Session ID: {session.id.slice(0, 8)}</Badge>
             <Badge variant="secondary" className="capitalize">{session.difficulty_level}</Badge>
           </div>
        )}
      </div>

      {/* Overall Score */}
      <div className="space-y-6">
        {session.feedback && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-primary">
                    {isAdmin ? 'AI Performance Analysis' : 'AI Performance Summary'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{session.feedback}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div>
              <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}
              </div>
              <div className="text-2xl text-muted-foreground">/ 100</div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge {...getScoreBadge(overallScore)}>
                {getScoreBadge(overallScore).label}
              </Badge>
            </div>

            <div className={`grid grid-cols-1 ${isCommunicationInterview ? 'md:grid-cols-5' : 'md:grid-cols-3'} gap-6 mt-8`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{answers.length}</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{formatDuration(totalTime)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{avgWordsPerAnswer}</div>
                <div className="text-sm text-muted-foreground">Avg Words/Answer</div>
              </div>
              {isCommunicationInterview && avgVocabularyScore !== null && (
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(avgVocabularyScore)}`}>{avgVocabularyScore}%</div>
                  <div className="text-sm text-muted-foreground">Vocabulary Score</div>
                </div>
              )}
              {isCommunicationInterview && avgPronunciationScore !== null && (
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(avgPronunciationScore)}`}>{avgPronunciationScore}%</div>
                  <div className="text-sm text-muted-foreground">Pronunciation</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="answers">Answer Review</TabsTrigger>
          <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
          <TabsTrigger value="recommendations">
            <BookOpen className="w-4 h-4 mr-2" />
            Preparation Guide
          </TabsTrigger>
          {isCommunicationInterview && (
            <TabsTrigger value="vocabulary">Vocabulary Analysis</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {answers.map((answer, index) => (
              <Card key={answer.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {answer.question_text}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!isCommunicationInterview ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Result</span>
                          <span className={`text-lg font-bold ${getScoreColor(answer.overall_score)}`}>
                            {answer.overall_score === 100 ? 'Correct ✓' : 'Incorrect ✗'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Score</span>
                          <span className={`text-lg font-bold ${getScoreColor(answer.overall_score)}`}>
                            {Math.round(answer.overall_score)}/100
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Communication</span>
                          <span className={`text-lg font-bold ${getScoreColor(answer.communication_score || answer.overall_score)}`}>
                            {Math.round(answer.communication_score || answer.overall_score)}/100
                          </span>
                        </div>
                        
                        {answer.vocabulary_score && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Vocabulary</span>
                            <span className={`text-lg font-bold ${getScoreColor(answer.vocabulary_score)}`}>
                              {Math.round(answer.vocabulary_score)}/100
                            </span>
                          </div>
                        )}
                        
                        {answer.pronunciation_score && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Pronunciation</span>
                            <span className={`text-lg font-bold ${getScoreColor(answer.pronunciation_score)}`}>
                              {Math.round(answer.pronunciation_score)}/100
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-2">
                      <Progress value={answer.overall_score} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="answers">
          <div className="space-y-6">
            {answers.map((answer, index) => {
              const isCorrect = !isCommunicationInterview && answer.overall_score === 100;
              const hasCorrectAnswer = answer.ai_feedback?.correct_answer;
              
              return (
                <Card key={answer.id} className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                        isCommunicationInterview 
                          ? 'bg-primary' 
                          : isCorrect ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {index + 1}
                      </span>
                      Question {index + 1}
                      {!isCommunicationInterview && (
                        isCorrect ? (
                          <Badge variant="default" className="ml-2">Correct</Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2">Incorrect</Badge>
                        )
                      )}
                      {isCommunicationInterview && (
                        <div className="flex gap-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Voice Answer
                          </Badge>
                          {answer.vocabulary_score && (
                            <Badge variant="secondary" className="text-xs">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Vocab: {Math.round(answer.vocabulary_score)}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>{answer.question_text}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            Your Answer:
                            {!isCommunicationInterview && !isCorrect && <span className="text-red-600 text-xl">✗</span>}
                            {!isCommunicationInterview && isCorrect && <span className="text-green-600 text-xl">✓</span>}
                          </h4>
                          <div className={`p-4 rounded-lg ${
                            isCommunicationInterview 
                              ? 'bg-muted border-2 border-muted-foreground/20' 
                              : isCorrect 
                                ? 'bg-green-50 text-green-700 border-2 border-green-200 font-bold text-lg' 
                                : 'bg-red-50 text-red-700 border-2 border-red-200 font-bold text-lg'
                          }`}>
                            {isCommunicationInterview ? (
                              <div className="text-sm">
                                <div className="font-medium mb-2">Transcribed Speech:</div>
                                <div className="italic">{answer.answer_text}</div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {answer.word_count} words • {formatDuration(answer.time_taken_seconds)}
                                </div>
                              </div>
                            ) : (
                              `Option ${answer.answer_text}`
                            )}
                          </div>
                        </div>
                        
                        {!isCommunicationInterview && !isCorrect && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-green-700">
                              Correct Answer:
                              <span className="text-green-600 text-xl">✓</span>
                            </h4>
                            <div className="p-4 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg font-bold text-lg">
                              Option {answer.ai_feedback?.correct_answer || 'Not available'}
                            </div>
                          </div>
                        )}
                      </div>

                      {answer.ai_feedback?.explanation && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                          <p className="text-sm text-blue-800">{answer.ai_feedback.explanation}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDuration(answer.time_taken_seconds)}</span>
                        <span className={`font-medium ${getScoreColor(answer.overall_score)}`}>
                          Score: {Math.round(answer.overall_score)}/100
                        </span>
                        {isCommunicationInterview && answer.vocabulary_score && (
                          <span className={`font-medium ${getScoreColor(answer.vocabulary_score)}`}>
                            Vocabulary: {Math.round(answer.vocabulary_score)}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-6">
            {session.feedback && (
              <Card className="border-border/50 bg-background/50 glass-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <MessageSquare className="w-6 h-6" />
                    Overall Performance Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground italic">
                    "{session.feedback}"
                  </p>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Key Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {answers.filter(a => a.overall_score >= 80).length > 0 ? (
                          answers.filter(a => a.overall_score >= 80).slice(0, 3).map((a, i) => (
                            <li key={i}>Excellent performance on: {a.question_text.split(' ').slice(0, 5).join(' ')}...</li>
                          ))
                        ) : (
                          <li>Consistent effort across all questions.</li>
                        )}
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <h4 className="font-bold text-orange-700 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Primary Focus Areas
                      </h4>
                      <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                        {answers.filter(a => a.overall_score < 70).length > 0 ? (
                          answers.filter(a => a.overall_score < 70).slice(0, 3).map((a, i) => (
                            <li key={i}>Needs review: {a.question_text.split(' ').slice(0, 5).join(' ')}...</li>
                          ))
                        ) : (
                          <li>No major weak areas identified. Focus on advanced concepts.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-sm text-muted-foreground">Detailed Question-by-Question Feedback</span>
              </div>
            </div>

            {answers.map((answer, index) => (
              <Card key={answer.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Question {index + 1} Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {answer.ai_feedback?.strengths && answer.ai_feedback.strengths.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-medium text-green-600 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {answer.ai_feedback.strengths.map((strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {answer.ai_feedback?.improvements && answer.ai_feedback.improvements.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-medium text-orange-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {answer.ai_feedback.improvements.map((improvement: string, i: number) => (
                            <li key={i}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {answer.keywords_found?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Keywords Found:</h4>
                        <div className="flex flex-wrap gap-2">
                          {answer.keywords_found.map((keyword, i) => (
                            <Badge key={i} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {answer.keywords_missing?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Suggested Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {answer.keywords_missing.map((keyword, i) => (
                            <Badge key={i} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-6">
            <Card className="border-border/50 bg-background/50 glass-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <BookOpen className="w-6 h-6" />
                  {isAdmin ? 'Candidate Improvement Plan' : 'Your Personalized Preparation Guide'}
                </CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? 'Recommended actionable steps for the candidate to improve based on their performance.' 
                    : 'Based on your performance in this session, here are some actionable steps to improve.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => (
                      <Card key={rec.id || index} className="glass-card border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2">{rec.category}</Badge>
                            <Badge variant={rec.priority > 3 ? "destructive" : "secondary"}>
                              Priority: {rec.priority}/5
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold">{rec.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-muted-foreground italic">
                        Generating personalized recommendations... Complete more questions to get detailed advice.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  You scored an average of <span className="font-bold text-primary">{Math.round(overallScore)}%</span> across {answers.length} questions.
                </p>
                {answers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Key Takeaways:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li>Your best performance was on Question {answers.length > 0 ? answers.indexOf(answers.reduce((prev, curr) => (prev.overall_score > curr.overall_score) ? prev : curr)) + 1 : 'N/A'}.</li>
                      <li>Focus on topics related to {answers.filter(a => a.overall_score < 70).map(a => a.question_text.split(' ').slice(0, 3).join(' ')).join(', ')}...</li>
                      <li>Try to maintain a consistent time per answer (average: {formatDuration(answers.length > 0 ? Math.round(totalTime / answers.length) : 0)}).</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isCommunicationInterview && (
          <TabsContent value="vocabulary">
            <div className="space-y-6">
              {answers.map((answer, index) => {
                // Check if this answer has comprehensive vocabulary analysis
                const hasVocabAnalysis = answer.ai_feedback?.vocabulary_analysis || 
                                       answer.ai_feedback?.communication_analysis ||
                                       answer.ai_feedback?.overall_assessment;
                
                if (!hasVocabAnalysis) {
                  return (
                    <Card key={answer.id} className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          Question {index + 1} - Vocabulary Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Detailed vocabulary analysis not available for this answer.
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={answer.id} className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Question {index + 1} - Vocabulary Analysis
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {answer.question_text}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VocabularyAnalysis analysis={answer.ai_feedback} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!isAdmin && (
          <Button onClick={onStartNew} variant="hero" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            Start New Interview
          </Button>
        )}
        <Button 
          onClick={onReturnHome} 
          variant={isAdmin ? "hero" : "outline"}
          size="lg"
          className={cn(
            "transition-all",
            !isAdmin && "hover:text-primary hover:bg-primary/10"
          )}
        >
          <Home className="w-5 h-5 mr-2" />
          {isAdmin ? 'Return to Admin Dashboard' : 'Return to Dashboard'}
        </Button>
      </div>
    </div>
  );
};

export default InterviewResults;
