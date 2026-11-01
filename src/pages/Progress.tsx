
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressCharts from "@/components/progress/ProgressCharts";
import BadgeSystem from "@/components/gamification/BadgeSystem";
import RecommendationPanel from "@/components/recommendations/RecommendationPanel";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  ArrowLeft
} from "lucide-react";

const Progress = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    avgScore: 0,
    currentStreak: 0,
    bestScore: 0,
    totalTimeMinutes: 0,
  });
  const [loading, setLoading] = useState(true);

  async function fetchUserStats() {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { supabase } = await import('@/lib/supabase');

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('id, status, score, created_at')
        .eq('candidate_id', user.id);

      if (sessionsError) throw sessionsError;

      const completed = sessions?.filter(s => s.status === 'completed') || [];
      const scores = completed.map(s => Number(s.score) || 0).filter(s => s > 0);
      
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Fetch answers to calculate total time from the correct table
      const { data: answers, error: answersError } = await supabase
        .from('session_answers')
        .select('time_taken_seconds')
        .in('session_id', completed.map(s => s.id));

      if (answersError) {
        console.warn('Progress: Error fetching session_answers', answersError.message);
      }

      const totalTimeMinutes = answers
        ? Math.round(answers.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0) / 60)
        : 0;

      // Calculate streak
      const recentDates = new Set(
        completed
          .map(s => new Date(s.created_at).toDateString())
          .slice(-30) // Look at last 30 sessions for streak
      );
      const currentStreak = recentDates.size;

      setStats({
        totalSessions: sessions?.length || 0,
        completedSessions: completed.length,
        avgScore,
        currentStreak,
        bestScore,
        totalTimeMinutes,
      });
    } catch (error) {
      console.error('Progress: Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserStats();
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
    } else if (userRole === UserRole.ADMIN) {
      navigate("/admin");
    }
  }, [user, userRole, navigate, authLoading]);

  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen hero-gradient">
      {/* Show a subtle loading bar at the top if auth or stats are still fetching */}
      {(authLoading || loading) && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[60]">
          <div className="h-full bg-primary animate-pulse w-1/3" />
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4 hover:text-primary hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
            <p className="text-muted-foreground">
              Track your improvement and achievements
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground">
                Across all sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bestScore}%</div>
              <p className="text-xs text-muted-foreground">
                Personal record
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
              <Award className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTimeMinutes}m</div>
              <p className="text-xs text-muted-foreground">
                Total time practiced
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <ProgressCharts userId={user?.id || ''} />
          <BadgeSystem userId={user?.id || ''} userStats={stats} />
          <RecommendationPanel userId={user?.id || ''} />
        </div>
      </div>
    </div>
  );
};

export default Progress;
