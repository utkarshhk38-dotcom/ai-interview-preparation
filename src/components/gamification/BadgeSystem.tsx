import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  Award, 
  Zap, 
  Crown, 
  Shield,
  Lock,
  TrendingUp,
  Download
} from "lucide-react";

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
}

interface BadgeDefinition {
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  requirement: string;
  progress?: number;
  maxProgress?: number;
  earned?: boolean;
}

interface BadgeSystemProps {
  userId: string;
  userStats: {
    totalSessions: number;
    completedSessions: number;
    avgScore: number;
    currentStreak: number;
  };
}

interface UserProfile {
  full_name: string;
  email: string;
}

interface InterviewTypeCount {
  technical: boolean;
  behavioral: boolean;
  hr: boolean;
}

const BadgeSystem = ({ userId, userStats }: BadgeSystemProps) => {
  // Defensive check to prevent crash if stats are missing
  const stats = userStats || {
    totalSessions: 0,
    completedSessions: 0,
    avgScore: 0,
    currentStreak: 0
  };

  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);

  const [loading, setLoading] = useState(true);
  const [interviewTypes, setInterviewTypes] = useState<InterviewTypeCount>({
    technical: false,
    behavioral: false,
    hr: false,
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const badgeDefinitions: BadgeDefinition[] = [
    {
      type: 'first_interview',
      name: 'First Steps',
      description: 'Complete your first interview',
      icon: Target,
      color: 'text-blue-600',
      requirement: 'Complete 1 interview',
      progress: Math.min(stats.completedSessions, 1),
      maxProgress: 1,
    },
    {
      type: 'streak_7',
      name: 'Week Warrior',
      description: 'Practice for 7 days in a row',
      icon: Flame,
      color: 'text-orange-600',
      requirement: '7-day streak',
      progress: Math.min(stats.currentStreak, 7),
      maxProgress: 7,
    },
    {
      type: 'perfect_score',
      name: 'Perfectionist',
      description: 'Score 90+ in an interview',
      icon: Star,
      color: 'text-yellow-600',
      requirement: 'Score 90+ points',
      progress: stats.avgScore >= 90 ? 1 : 0,
      maxProgress: 1,
    },
    {
      type: 'sessions_10',
      name: 'Dedicated Learner',
      description: 'Complete 10 interview sessions',
      icon: Award,
      color: 'text-green-600',
      requirement: 'Complete 10 sessions',
      progress: Math.min(stats.completedSessions, 10),
      maxProgress: 10,
    },
    {
      type: 'improvement_20',
      name: 'Rising Star',
      description: 'Improve score by 20 points',
      icon: TrendingUp,
      color: 'text-purple-600',
      requirement: '20-point improvement',
      progress: 0,
      maxProgress: 20,
    },
    {
      type: 'sessions_50',
      name: 'Interview Master',
      description: 'Complete 50 interview sessions',
      icon: Crown,
      color: 'text-indigo-600',
      requirement: 'Complete 50 sessions',
      progress: Math.min(stats.completedSessions, 50),
      maxProgress: 50,
    },
    {
      type: 'streak_30',
      name: 'Consistency Champion',
      description: 'Practice for 30 days in a row',
      icon: Shield,
      color: 'text-red-600',
      requirement: '30-day streak',
      progress: Math.min(stats.currentStreak, 30),
      maxProgress: 30,
    },

    {
      type: 'all_types',
      name: 'Versatile Pro',
      description: 'Complete all interview types',
      icon: Zap,
      color: 'text-cyan-600',
      requirement: 'Complete all types',
      progress: (interviewTypes.technical ? 1 : 0) + (interviewTypes.behavioral ? 1 : 0) + (interviewTypes.hr ? 1 : 0),
      maxProgress: 3,
    },
  ];

  useEffect(() => {
    fetchUserProfile();
    fetchInterviewTypes();
    fetchEarnedBadges();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      checkAndAwardBadges();
    }
  }, [stats, interviewTypes]);

  const fetchInterviewTypes = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select('interview_type')
        .eq('candidate_id', userId)
        .eq('status', 'completed');

      if (sessions) {
        const types = {
          technical: sessions.some(s => s.interview_type === 'technical'),
          behavioral: sessions.some(s => s.interview_type === 'behavioral'),
          hr: sessions.some(s => s.interview_type === 'hr'),
        };
        setInterviewTypes(types);
      }
    } catch (error) {
      console.error('Error fetching interview types:', error);
    }
  };

  const fetchEarnedBadges = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      setEarnedBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardBadges = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Check which badges should be awarded
      const badgesToAward = [];

      // First Steps - Complete 1 interview
      if (stats.completedSessions >= 1) {
        badgesToAward.push({
          badge_type: 'first_interview',
          badge_name: 'First Steps',
          badge_description: 'Complete your first interview'
        });
      }

      // Dedicated Learner - Complete 10 sessions
      if (stats.completedSessions >= 10) {
        badgesToAward.push({
          badge_type: 'sessions_10',
          badge_name: 'Dedicated Learner',
          badge_description: 'Complete 10 interview sessions'
        });
      }

      // Interview Master - Complete 50 sessions
      if (stats.completedSessions >= 50) {
        badgesToAward.push({
          badge_type: 'sessions_50',
          badge_name: 'Interview Master',
          badge_description: 'Complete 50 interview sessions'
        });
      }

      // Week Warrior - 7 day streak
      if (stats.currentStreak >= 7) {
        badgesToAward.push({
          badge_type: 'streak_7',
          badge_name: 'Week Warrior',
          badge_description: 'Practice for 7 days in a row'
        });
      }

      // Consistency Champion - 30 day streak
      if (stats.currentStreak >= 30) {
        badgesToAward.push({
          badge_type: 'streak_30',
          badge_name: 'Consistency Champion',
          badge_description: 'Practice for 30 days in a row'
        });
      }

      // Perfectionist - Score 90+
      if (stats.avgScore >= 90) {
        badgesToAward.push({
          badge_type: 'perfect_score',
          badge_name: 'Perfectionist',
          badge_description: 'Score 90+ in an interview'
        });
      }

      // Versatile Pro - Complete all interview types
      const completedAllTypes = interviewTypes.technical && interviewTypes.behavioral && interviewTypes.hr;
      if (completedAllTypes) {
        badgesToAward.push({
          badge_type: 'all_types',
          badge_name: 'Versatile Pro',
          badge_description: 'Complete all interview types'
        });
      }

      // Award badges that haven't been earned yet
      for (const badge of badgesToAward) {
        const alreadyEarned = earnedBadges.some(b => b.badge_type === badge.badge_type);
        if (!alreadyEarned) {
          await supabase.from('user_badges').insert([{
            user_id: userId,
            ...badge
          }]);
        }
      }

      // Refresh badges after awarding
      if (badgesToAward.length > 0) {
        fetchEarnedBadges();
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const badges = badgeDefinitions.map(badge => ({
    ...badge,
    earned: earnedBadges.some(eb => eb.badge_type === badge.type),
  }));

  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;

  const downloadCertificate = (badge: BadgeDefinition) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative gradient border
    const borderGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    borderGradient.addColorStop(0, '#6366f1');
    borderGradient.addColorStop(0.5, '#8b5cf6');
    borderGradient.addColorStop(1, '#ec4899');
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 30;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Inner decorative border
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

    // Top decorative elements
    ctx.fillStyle = borderGradient;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 120, 60, 0, Math.PI * 2);
    ctx.fill();

    // Trophy/Star icon (simplified)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', canvas.width / 2, 135);

    // Title
    const titleGradient = ctx.createLinearGradient(0, 200, canvas.width, 200);
    titleGradient.addColorStop(0, '#6366f1');
    titleGradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 70px Arial';
    ctx.fillText('CERTIFICATE', canvas.width / 2, 230);
    ctx.font = 'bold 50px Arial';
    ctx.fillText('OF ACHIEVEMENT', canvas.width / 2, 290);

    // Subtitle line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 330);
    ctx.lineTo(canvas.width - 300, 330);
    ctx.stroke();

    // Presented to text
    ctx.fillStyle = '#6b7280';
    ctx.font = '28px Arial';
    ctx.fillText('This certificate is proudly presented to', canvas.width / 2, 400);

    // User name with underline
    const userName = userProfile?.full_name || 'Certificate Holder';
    ctx.fillStyle = '#1f2937';
    ctx.font = 'italic bold 55px Georgia';
    ctx.fillText(userName, canvas.width / 2, 480);
    
    // Name underline
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 250, 500);
    ctx.lineTo(canvas.width / 2 + 250, 500);
    ctx.stroke();

    // Achievement text
    ctx.fillStyle = '#6b7280';
    ctx.font = '26px Arial';
    ctx.fillText('For successfully earning the', canvas.width / 2, 570);

    // Badge name with background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(canvas.width / 2 - 300, 590, 600, 80);
    ctx.fillStyle = borderGradient;
    ctx.font = 'bold 48px Arial';
    ctx.fillText(badge.name, canvas.width / 2, 645);

    // Badge description
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px Arial';
    ctx.fillText(badge.description, canvas.width / 2, 710);

    // Date section
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillStyle = '#9ca3af';
    ctx.font = '22px Arial';
    ctx.fillText(`Awarded on ${date}`, canvas.width / 2, 790);

    // Bottom section
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 840);
    ctx.lineTo(canvas.width - 200, 840);
    ctx.stroke();

    // Footer
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('AI INTERVIEW COACH', canvas.width / 2, 890);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px Arial';
    ctx.fillText('Interview Preparation Excellence Platform', canvas.width / 2, 925);

    // Decorative corner elements
    ctx.fillStyle = borderGradient;
    [
      [100, 100], [canvas.width - 100, 100],
      [100, canvas.height - 100], [canvas.width - 100, canvas.height - 100]
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Convert to image and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${badge.name.replace(/\s+/g, '_')}_Certificate.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary animate-bounce-slow" />
          Achievements
        </CardTitle>
        <CardDescription>
          Earn badges by completing challenges and improving your skills
        </CardDescription>
        <div className="flex items-center gap-4 mt-4 bg-muted/20 p-3 rounded-lg border border-border/50">
          <div className="flex-1">
            <Progress value={(earnedCount / totalCount) * 100} className="h-2.5" />
          </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap bg-background px-2.5 py-1 rounded-md border border-border shadow-sm">
            {earnedCount} / {totalCount} Earned
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            const isEarned = badge.earned;
            const progressPercent = badge.maxProgress 
              ? (badge.progress! / badge.maxProgress) * 100 
              : 0;

            return (
              <div
                key={badge.type}
                className={`relative p-5 border-2 rounded-xl transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                  isEarned
                    ? 'border-primary/20 bg-gradient-to-br from-background/80 via-primary/5 to-secondary/5 shadow-sm hover:shadow-md hover:border-primary/40'
                    : 'border-border/60 bg-muted/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3 flex-grow">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105 ${
                      isEarned 
                        ? 'bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-muted/80'
                    }`}
                  >
                    {isEarned ? (
                      <Icon className={`w-7 h-7 ${badge.color}`} />
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm tracking-tight text-foreground">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground leading-snug px-1">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 w-full flex flex-col items-center justify-end space-y-2">
                  {!isEarned && badge.maxProgress && (
                    <div className="w-full space-y-1.5 px-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Progress</span>
                        <span>{badge.progress} / {badge.maxProgress}</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  )}
                  {isEarned && (
                    <div className="w-full flex flex-col items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] py-0.5 px-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                        Earned
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCertificate(badge)}
                        className="w-full h-8 text-[11px] font-medium border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-primary flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Certificate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgeSystem;
