import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Target,
  Award,
  Volume2,
  Brain,
  Users
} from "lucide-react";

interface VocabularyAnalysisProps {
  analysis: {
    vocabulary_analysis: {
      vocabulary_score: number;
      word_count: number;
      unique_words: number;
      advanced_words: string[];
      basic_words: string[];
      technical_terms: string[];
      vocabulary_level: string;
      word_variety_score: number;
    };
    communication_analysis: {
      fluency_score: number;
      clarity_score: number;
      coherence_score: number;
      pronunciation_indicators: {
        filler_words: string[];
        repetitions: string[];
        hesitations: number;
      };
      sentence_structure: {
        simple_sentences: number;
        complex_sentences: number;
        sentence_variety_score: number;
      };
    };
    professional_communication: {
      formality_score: number;
      confidence_indicators: string[];
      professional_vocabulary: string[];
      interview_readiness_score: number;
    };
    grammar_analysis: {
      grammar_score: number;
      tense_usage: string;
      subject_verb_agreement: string;
      potential_errors: string[];
    };
    overall_assessment: {
      communication_score: number;
      strengths: string[];
      areas_for_improvement: string[];
      recommendations: string[];
      proficiency_level: string;
    };
    detailed_feedback: {
      vocabulary_feedback: string;
      communication_feedback: string;
      improvement_suggestions: string[];
    };
    pronunciation_analysis?: {
      clarity_score: number;
      potential_mispronunciations: Array<{
        word: string;
        likely_intended: string;
        confidence: number;
      }>;
      speech_patterns: {
        speaking_pace: string;
        word_stress: string;
        intonation: string;
      };
      recommendations: string[];
    };
  };
}

const VocabularyAnalysis = ({ analysis }: VocabularyAnalysisProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'advanced': return "text-green-600";
      case 'intermediate': return "text-yellow-600";
      case 'basic':
      case 'beginner': return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Overall Communication Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_assessment.communication_score)}`}>
                {analysis.overall_assessment.communication_score}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${getLevelColor(analysis.overall_assessment.proficiency_level)}`}>
                {analysis.overall_assessment.proficiency_level.charAt(0).toUpperCase() + 
                 analysis.overall_assessment.proficiency_level.slice(1)}
              </div>
              <p className="text-sm text-muted-foreground">Proficiency Level</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {analysis.vocabulary_analysis.word_count} words
              </div>
              <p className="text-sm text-muted-foreground">Total Words</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vocabulary Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Vocabulary Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vocabulary Score</span>
                <Badge variant={getScoreBadgeVariant(analysis.vocabulary_analysis.vocabulary_score)}>
                  {analysis.vocabulary_analysis.vocabulary_score}%
                </Badge>
              </div>
              <Progress value={analysis.vocabulary_analysis.vocabulary_score} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Word Variety</span>
                <Badge variant={getScoreBadgeVariant(analysis.vocabulary_analysis.word_variety_score)}>
                  {analysis.vocabulary_analysis.word_variety_score}%
                </Badge>
              </div>
              <Progress value={analysis.vocabulary_analysis.word_variety_score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Unique Words:</span>
                <span className="ml-2 font-medium">{analysis.vocabulary_analysis.unique_words}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className={`ml-2 font-medium ${getLevelColor(analysis.vocabulary_analysis.vocabulary_level)}`}>
                  {analysis.vocabulary_analysis.vocabulary_level}
                </span>
              </div>
            </div>

            {analysis.vocabulary_analysis.advanced_words.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">Advanced Words Used:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.vocabulary_analysis.advanced_words.slice(0, 8).map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {analysis.vocabulary_analysis.advanced_words.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{analysis.vocabulary_analysis.advanced_words.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {analysis.vocabulary_analysis.technical_terms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">Technical Terms:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.vocabulary_analysis.technical_terms.slice(0, 6).map((term, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Communication Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fluency</span>
                <Badge variant={getScoreBadgeVariant(analysis.communication_analysis.fluency_score)}>
                  {analysis.communication_analysis.fluency_score}%
                </Badge>
              </div>
              <Progress value={analysis.communication_analysis.fluency_score} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Clarity</span>
                <Badge variant={getScoreBadgeVariant(analysis.communication_analysis.clarity_score)}>
                  {analysis.communication_analysis.clarity_score}%
                </Badge>
              </div>
              <Progress value={analysis.communication_analysis.clarity_score} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Coherence</span>
                <Badge variant={getScoreBadgeVariant(analysis.communication_analysis.coherence_score)}>
                  {analysis.communication_analysis.coherence_score}%
                </Badge>
              </div>
              <Progress value={analysis.communication_analysis.coherence_score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Simple Sentences:</span>
                <span className="ml-2 font-medium">{analysis.communication_analysis.sentence_structure.simple_sentences}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Complex Sentences:</span>
                <span className="ml-2 font-medium">{analysis.communication_analysis.sentence_structure.complex_sentences}</span>
              </div>
            </div>

            {analysis.communication_analysis.pronunciation_indicators.filler_words.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-2">Filler Words Detected:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.communication_analysis.pronunciation_indicators.filler_words.map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs text-yellow-600">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Professional Communication & Grammar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Communication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Professional Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Interview Readiness</span>
                <Badge variant={getScoreBadgeVariant(analysis.professional_communication.interview_readiness_score)}>
                  {analysis.professional_communication.interview_readiness_score}%
                </Badge>
              </div>
              <Progress value={analysis.professional_communication.interview_readiness_score} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Formality</span>
                <Badge variant={getScoreBadgeVariant(analysis.professional_communication.formality_score)}>
                  {analysis.professional_communication.formality_score}%
                </Badge>
              </div>
              <Progress value={analysis.professional_communication.formality_score} className="h-2" />
            </div>

            {analysis.professional_communication.confidence_indicators.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">Confidence Indicators:</p>
                <div className="space-y-1">
                  {analysis.professional_communication.confidence_indicators.slice(0, 3).map((indicator, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.professional_communication.professional_vocabulary.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">Professional Vocabulary:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.professional_communication.professional_vocabulary.slice(0, 6).map((word, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grammar Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Grammar & Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Grammar Score</span>
                <Badge variant={getScoreBadgeVariant(analysis.grammar_analysis.grammar_score)}>
                  {analysis.grammar_analysis.grammar_score}%
                </Badge>
              </div>
              <Progress value={analysis.grammar_analysis.grammar_score} className="h-2" />
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tense Usage:</span>
                <span className={`font-medium ${
                  analysis.grammar_analysis.tense_usage === 'correct' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {analysis.grammar_analysis.tense_usage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject-Verb Agreement:</span>
                <span className={`font-medium ${
                  analysis.grammar_analysis.subject_verb_agreement === 'correct' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {analysis.grammar_analysis.subject_verb_agreement}
                </span>
              </div>
            </div>

            {analysis.grammar_analysis.potential_errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-2">Areas to Review:</p>
                <div className="space-y-1">
                  {analysis.grammar_analysis.potential_errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3 h-3 text-yellow-600" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pronunciation Analysis (if available) */}
      {analysis.pronunciation_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-orange-600" />
              Pronunciation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pronunciation Clarity</span>
                <Badge variant={getScoreBadgeVariant(analysis.pronunciation_analysis.clarity_score)}>
                  {analysis.pronunciation_analysis.clarity_score}%
                </Badge>
              </div>
              <Progress value={analysis.pronunciation_analysis.clarity_score} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Speaking Pace:</span>
                <div className="font-medium">{analysis.pronunciation_analysis.speech_patterns.speaking_pace}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Word Stress:</span>
                <div className="font-medium">{analysis.pronunciation_analysis.speech_patterns.word_stress}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Intonation:</span>
                <div className="font-medium">{analysis.pronunciation_analysis.speech_patterns.intonation}</div>
              </div>
            </div>

            {analysis.pronunciation_analysis.potential_mispronunciations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">Potential Mispronunciations:</p>
                <div className="space-y-2">
                  {analysis.pronunciation_analysis.potential_mispronunciations.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-orange-50 p-2 rounded">
                      <span>"{item.word}" → "{item.likely_intended}"</span>
                      <Badge variant="outline" className="text-xs">
                        {item.confidence}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.overall_assessment.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Target className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.overall_assessment.areas_for_improvement.map((area, index) => (
                <div key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Detailed Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-600 mb-2">Vocabulary Feedback</h4>
            <p className="text-sm text-muted-foreground">{analysis.detailed_feedback.vocabulary_feedback}</p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium text-green-600 mb-2">Communication Feedback</h4>
            <p className="text-sm text-muted-foreground">{analysis.detailed_feedback.communication_feedback}</p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium text-purple-600 mb-2">Improvement Suggestions</h4>
            <div className="space-y-2">
              {analysis.detailed_feedback.improvement_suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.overall_assessment.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">{index + 1}</span>
                </div>
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyAnalysis;