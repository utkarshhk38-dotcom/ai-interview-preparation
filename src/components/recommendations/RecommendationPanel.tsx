import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  BookOpen, 
  Target, 
  TrendingUp,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Recommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  resources?: string[];
}

interface AnswerTemplate {
  id: string;
  question_type: string;
  template_name: string;
  template_structure: string;
  example_answer: string;
  tips: string[];
}

interface RecommendationPanelProps {
  userId: string;
  sessionId?: string;
}

const RecommendationPanel = ({ userId, sessionId }: RecommendationPanelProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [templates, setTemplates] = useState<AnswerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchTemplates();
  }, [userId, sessionId]);

  const fetchRecommendations = async () => {
    try {
      // Simple, practical interview tips
      const practicalTips: Recommendation[] = [
        {
          id: '1',
          recommendation_type: 'tip',
          title: 'Research the Company',
          description: 'Always research the company before the interview. Know their products, values, recent news, and culture.',
          priority: 'high',
          category: 'preparation',
        },
        {
          id: '2',
          recommendation_type: 'tip',
          title: 'Practice Your Body Language',
          description: 'Maintain eye contact, sit up straight, smile, and use hand gestures naturally. Body language speaks volumes.',
          priority: 'high',
          category: 'presentation',
        },
        {
          id: '3',
          recommendation_type: 'tip',
          title: 'Prepare Questions to Ask',
          description: 'Always have 2-3 thoughtful questions ready to ask the interviewer. It shows genuine interest.',
          priority: 'medium',
          category: 'engagement',
        },
        {
          id: '4',
          recommendation_type: 'tip',
          title: 'Use the STAR Method',
          description: 'For behavioral questions, structure answers using Situation, Task, Action, Result. Be specific with examples.',
          priority: 'high',
          category: 'technique',
        },
        {
          id: '5',
          recommendation_type: 'tip',
          title: 'Follow Up After Interview',
          description: 'Send a thank-you email within 24 hours. Mention specific topics discussed and reiterate your interest.',
          priority: 'medium',
          category: 'follow-up',
        },
      ];
      setRecommendations(practicalTips);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Common interview questions with perfect answers
      const commonQuestions: AnswerTemplate[] = [
        {
          id: '1',
          question_type: 'behavioral',
          template_name: 'Tell me about yourself',
          template_structure: 'Present → Past → Future',
          example_answer: 'I\'m currently a [Your Role] with [X years] of experience in [Field]. I specialize in [Key Skills]. Previously, I worked at [Company] where I [Major Achievement]. I\'m passionate about [Interest] and looking to [Career Goal]. I\'m excited about this opportunity because [Why This Role].',
          tips: [
            'Keep it under 2 minutes',
            'Focus on professional background',
            'Connect your story to the role'
          ]
        },
        {
          id: '2',
          question_type: 'behavioral',
          template_name: 'Why do you want to work here?',
          template_structure: 'Company Research → Personal Alignment → Contribution',
          example_answer: 'I\'m impressed by [Specific Company Achievement/Value]. Your focus on [Company Mission] aligns perfectly with my passion for [Your Interest]. I particularly admire [Recent Project/Initiative]. With my experience in [Your Skills], I believe I can contribute to [Specific Team/Goal] and grow alongside the company.',
          tips: [
            'Show you\'ve researched the company',
            'Be specific about what attracts you',
            'Explain how you can add value'
          ]
        },
        {
          id: '3',
          question_type: 'hr',
          template_name: 'Where do you see yourself in 5 years?',
          template_structure: 'Growth → Skills → Leadership → Company Alignment',
          example_answer: 'In 5 years, I see myself as a [Advanced Role] with deep expertise in [Specific Area]. I want to develop skills in [New Skills] and take on more leadership responsibilities. I\'d love to mentor junior team members and contribute to strategic decisions. I believe this company offers the growth opportunities and challenges I need to achieve these goals.',
          tips: [
            'Show ambition but be realistic',
            'Align with company growth path',
            'Demonstrate long-term commitment'
          ]
        },
        {
          id: '4',
          question_type: 'technical',
          template_name: 'What are your strengths?',
          template_structure: 'Strength → Example → Impact',
          example_answer: 'My key strength is [Specific Skill]. For example, at [Company], I [Specific Achievement using that strength]. This resulted in [Quantifiable Impact like 30% improvement]. I\'m also strong in [Second Strength], which helps me [How it benefits the team].',
          tips: [
            'Choose strengths relevant to the job',
            'Back up with concrete examples',
            'Show how it benefits the employer'
          ]
        },
        {
          id: '5',
          question_type: 'technical',
          template_name: 'What are your weaknesses?',
          template_structure: 'Honest Weakness → Improvement Actions → Progress',
          example_answer: 'I used to struggle with [Real but not critical weakness]. I recognized this and took steps to improve by [Specific actions taken]. Now, I\'ve made significant progress - for example, [Evidence of improvement]. I continue to work on this by [Ongoing efforts].',
          tips: [
            'Be honest but strategic',
            'Show self-awareness',
            'Focus on improvement efforts',
            'Avoid clichés like "I\'m a perfectionist"'
          ]
        },
        {
          id: '6',
          question_type: 'behavioral',
          template_name: 'Why should we hire you?',
          template_structure: 'Skills Match → Unique Value → Enthusiasm',
          example_answer: 'I bring [X years] of experience in [Relevant Field] with proven success in [Key Achievement]. My expertise in [Specific Skills] directly addresses your need for [Job Requirement]. What sets me apart is [Unique Quality/Experience]. I\'m genuinely excited about [Specific Aspect of Role] and confident I can deliver results quickly.',
          tips: [
            'Match your skills to job requirements',
            'Highlight what makes you unique',
            'Show enthusiasm for the role'
          ]
        }
      ];
      setTemplates(commonQuestions);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const generateNewRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await fetch(getApiUrl('/api/interview/recommendations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, sessionId }),
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Interview Preparation Tips
          </CardTitle>
          <CardDescription>
            Essential tips to ace your interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">{rec.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.description}
                    </p>
                    {rec.resources && rec.resources.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rec.resources.map((resource, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            {resource}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Target className="w-5 h-5 text-primary flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-secondary" />
            Common Interview Questions & Perfect Answers
          </CardTitle>
          <CardDescription>
            Master these frequently asked questions with proven answer frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {templates.map((template, index) => (
              <div key={template.id} className="p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{template.template_name}</h4>
                    <div className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded mb-2">
                      {template.template_structure}
                    </div>
                  </div>
                </div>

                <div className="ml-11 space-y-3">
                  <div>
                    <h5 className="font-medium mb-2 text-sm text-muted-foreground">Perfect Answer:</h5>
                    <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                      <p className="text-sm leading-relaxed">{template.example_answer}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-sm text-muted-foreground">Pro Tips:</h5>
                    <ul className="space-y-1.5">
                      {template.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationPanel;
