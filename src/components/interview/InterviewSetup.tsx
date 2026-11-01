import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  Code, 
  Users, 
  Briefcase, 
  Clock, 
  Target,
  Play,
  Mic
} from "lucide-react";

interface InterviewSetupProps {
  onStart: (type: string, difficulty: string) => void;
  loading?: boolean;
}

const InterviewSetup = ({ onStart, loading = false }: InterviewSetupProps) => {
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const navigate = useNavigate();

  const handleTypeSelect = (value: string) => {
    setInterviewType(value);
  };

  const handleDifficultySelect = (value: string) => {
    setDifficulty(value);
  };

  const interviewTypes = [
    {
      value: "technical",
      label: "Technical Interview",
      description: "Programming, system design, and technical concepts",
      icon: Code,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      value: "behavioral",
      label: "Behavioral Interview",
      description: "Past experiences, teamwork, and problem-solving scenarios",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "communication",
      label: "Communication Round",
      description: "Voice-based vocabulary and speaking skills assessment",
      icon: Mic,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      value: "hr",
      label: "HR Interview",
      description: "Company culture, career goals, and general questions",
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const getDifficultyLevels = () => {
    const isCommunication = interviewType === 'communication';
    
    return [
      {
        value: "beginner",
        label: "Beginner",
        description: isCommunication ? "Basic vocabulary and simple communication" : "Basic concepts and simple scenarios",
        duration: isCommunication ? "5-8 min" : "15-20 min",
      },
      {
        value: "intermediate",
        label: "Intermediate",
        description: isCommunication ? "Professional vocabulary and clear communication" : "Complex situations and detailed explanations",
        duration: isCommunication ? "8-12 min" : "20-30 min",
      },
      {
        value: "advanced",
        label: "Advanced",
        description: isCommunication ? "Advanced vocabulary and executive communication" : "Expert-level questions and strategic thinking",
        duration: isCommunication ? "12-15 min" : "30-45 min",
      },
    ];
  };

  const difficultyLevels = getDifficultyLevels();

  const handleStart = () => {
    if (interviewType && difficulty) {
      onStart(interviewType, difficulty);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-4 hover:text-primary hover:bg-primary/10 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Brain className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Start Interview Practice</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose your interview type and difficulty level. Our AI will generate personalized questions 
          and provide detailed feedback on your answers.
        </p>
      </div>

      {/* Interview Type Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Select Interview Type
          </CardTitle>
          <CardDescription>
            Choose the type of interview you want to practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {interviewTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = interviewType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  style={{ pointerEvents: 'auto', zIndex: 1 }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md text-left w-full ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-accent/5'
                  }`}
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${type.bgColor}`}>
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Level Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" />
            Select Difficulty Level
          </CardTitle>
          <CardDescription>
            Choose the difficulty level that matches your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {difficultyLevels.map((level) => {
              const isSelected = difficulty === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  style={{ pointerEvents: 'auto', zIndex: 1 }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md w-full text-left ${
                    isSelected
                      ? 'border-secondary bg-secondary/10 shadow-md'
                      : 'border-border hover:border-secondary/50 hover:bg-accent/5'
                  }`}
                  onClick={() => handleDifficultySelect(level.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{level.label}</h3>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-secondary">{level.duration}</div>
                      <div className="text-xs text-muted-foreground">Estimated time</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="text-center">
        <Button
          onClick={handleStart}
          disabled={!interviewType || !difficulty || loading}
          variant="hero"
          size="lg"
          className="px-8 py-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Starting Interview...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Interview
            </>
          )}
        </Button>
        
        {interviewType && difficulty && (
          <p className="text-sm text-muted-foreground mt-3">
            Ready to start a {difficulty} level {interviewType} interview
          </p>
        )}
      </div>
    </div>
  );
};

export default InterviewSetup;
