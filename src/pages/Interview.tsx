
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, supabase } from "@/lib/supabase";
import InterviewSetup from "@/components/interview/InterviewSetup";
import InterviewSession from "@/components/interview/InterviewSession";
import InterviewResults from "@/components/interview/InterviewResults";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

type InterviewState = 'setup' | 'session' | 'results';

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [state, setState] = useState<InterviewState>(() => {
    const stateData = location.state as any;
    return (stateData?.sessionId && stateData?.view) ? stateData.view : 'setup';
  });
  const [sessionId, setSessionId] = useState<string>(() => {
    const stateData = location.state as any;
    return stateData?.sessionId || '';
  });
  const [interviewType, setInterviewType] = useState<string>(() => {
    const stateData = location.state as any;
    return stateData?.interviewType || '';
  });
  const [difficulty, setDifficulty] = useState<string>(() => {
    const stateData = location.state as any;
    return stateData?.difficulty || '';
  });
  const [returnTab, setReturnTab] = useState<string>(() => {
    const stateData = location.state as any;
    return stateData?.returnTab || '';
  });
  const [loading, setLoading] = useState(false);
  const { user, userRole, loading: authLoading } = useAuth();

  // Clear location state after initialization to prevent re-runs on refresh
  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (userRole === UserRole.ADMIN) {
      if (state !== 'results') {
        navigate('/admin');
      }
    } else if (userRole !== UserRole.CANDIDATE) {
      navigate('/login');
    }
  }, [user, userRole, authLoading, navigate, state]);

  const handleStartInterview = async (type: string, difficultyLevel: string) => {
    let currentUserId = user?.id;
    if (!currentUserId) {
      console.log('⚠️ userId not in auth context state, trying fallback to active session...');
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start the interview.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Client starting interview. User ID:', currentUserId);
      const response = await fetch(getApiUrl('/api/interview/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          interviewType: type,
          difficultyLevel,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session.id);
        setInterviewType(type);
        setDifficulty(difficultyLevel);
        setState('session');
        
        toast({
          title: "Interview Started!",
          description: `Your ${type} interview session has begun.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = (completedSessionId: string) => {
    setSessionId(completedSessionId);
    setState('results');
    toast({
      title: "Interview Completed!",
      description: "Great job! Check out your detailed feedback.",
    });
  };

  const handleReturnHome = () => {
    if (userRole === UserRole.ADMIN) {
      navigate('/admin', { state: { defaultTab: returnTab || 'sessions' } });
    } else {
      navigate('/dashboard');
    }
  };

  const handleStartNew = () => {
    setState('setup');
    setSessionId('');
    setInterviewType('');
    setDifficulty('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading interview setup...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen hero-gradient">

      {state === 'setup' && (
        <InterviewSetup
          onStart={handleStartInterview}
          loading={loading}
        />
      )}
      
      {state === 'session' && (
        <InterviewSession
          sessionId={sessionId}
          interviewType={interviewType}
          difficulty={difficulty}
          onComplete={handleCompleteInterview}
        />
      )}
      
      {state === 'results' && (
        <InterviewResults
          sessionId={sessionId}
          userRole={userRole}
          onReturnHome={handleReturnHome}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
};

export default Interview;
