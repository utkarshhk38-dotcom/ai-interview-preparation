import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  LogOut, 
  Play, 
  Clock, 
  Award, 
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  FileText,
  Trash2,
  AlertCircle,
  Settings,
  Edit2,
  User
} from "lucide-react";
import ResumeUpload from "@/components/dashboard/ResumeUpload";

interface UserStats {
  totalSessions: number;
  completedSessions: number;
  avgScore: number;
  lastSession: string | null;
}

const CandidateDashboard = () => {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>(() => {
    // Try to load from cache for instant initial render
    const cached = localStorage.getItem('dashboard_stats');
    return cached ? JSON.parse(cached) : {
      totalSessions: 0,
      completedSessions: 0,
      avgScore: 0,
      lastSession: null,
    };
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  
  const [profile, setProfile] = useState<{ full_name: string; email: string; skills?: string[]; avatar_url?: string } | null>(() => {
    const cached = localStorage.getItem('user_profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, skills, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setEditFullName(data.full_name || "");
        localStorage.setItem('user_profile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Only act when auth check is complete
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    // EAGER LOAD: If we have a user, start fetching data immediately
    // even before the official userRole check finishes in AuthContext.
    // This makes the refresh feel much faster.
    loadDashboardData();

    // Secondary Check: Role-based navigation
    if (userRole === UserRole.ADMIN) {
      navigate("/admin");
    }
  }, [user, userRole, navigate, authLoading]);

  const loadDashboardData = async () => {
    if (!user || !mounted.current) return;
    
    // Parallelize profile and stats fetching
    await Promise.all([
      fetchProfile(),
      fetchUserStats()
    ]);
  };


  const [recentSessions, setRecentSessions] = useState<any[]>(() => {
    const cached = localStorage.getItem('recent_sessions');
    return cached ? JSON.parse(cached) : [];
  });

  const fetchUserStats = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // Add timeout wrapper for the query (8 seconds)
      const fetchPromise = supabase
        .from('interview_sessions')
        .select('id, interview_type, status, difficulty_level, score, created_at')
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Stats fetch timeout')), 8000)
      );

      const { data: sessions, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;

      const completed = sessions?.filter(s => s.status === 'completed') || [];
      const avgScore = completed.length > 0
        ? completed.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / completed.length
        : 0;

      const lastSession = sessions && sessions.length > 0
        ? sessions[0].created_at
        : null;

      const newStats = {
        totalSessions: sessions?.length || 0,
        completedSessions: completed.length,
        avgScore: Math.round(avgScore * 10) / 10,
        lastSession,
      };

      setStats(newStats);
      localStorage.setItem('dashboard_stats', JSON.stringify(newStats));

      // Store all sessions (limit display in render)
      setRecentSessions(sessions || []);
      localStorage.setItem('recent_sessions', JSON.stringify(sessions || []));
    } catch (error: any) {
      console.error('CandidateDashboard: Error fetching stats', error);
      // Show cached data on error
      if (error.message === 'Stats fetch timeout') {
        toast({
          title: "Loading Timeout",
          description: "Stats are taking longer than expected. Showing cached data.",
          variant: "destructive",
        });
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  // Failsafe: Ensure loading is eventually cleared even if fetch hangs
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading && mounted.current) {
          console.warn('CandidateDashboard: Loading timed out, forcing display with cached data');
          setLoading(false);
        }
      }, 6000); // 6 second failsafe
      return () => clearTimeout(timer);
    }
  }, [loading]);




  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (error) throw error;

      // Update local state
      setRecentSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      
      // Re-fetch stats to update totals
      fetchUserStats();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editFullName })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, full_name: editFullName } : null);
      
      // If password fields are filled, update password too
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        
        const { error: pwdError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (pwdError) throw pwdError;
        setNewPassword("");
        setConfirmPassword("");
      }

      setIsEditDialogOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your details have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* Show a subtle loading bar at the top if data is still fetching */}
      {(authLoading || loading) && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[60]">
          <div className="h-full bg-primary animate-pulse w-1/3" />
        </div>
      )}

      {/* Header */}
      <nav className="glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">My Dashboard</h1>
              <p className="text-xs text-muted-foreground">{profile?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="heroOutline" size="sm" onClick={() => navigate('/profile')} className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Profile & Skills</span>
            </Button>
            <Button variant="heroOutline" size="sm" onClick={handleSignOut} className="gap-2 hover:border-destructive/50 hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
              </h2>
              <p className="text-muted-foreground">
                Ready to practice your interview skills?
              </p>
            </div>
          </div>
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.skills.slice(0, 5).map(skill => (
                <span key={skill} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {skill}
                </span>
              ))}
              {profile.skills.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{profile.skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Practice sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <Target className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.completedSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Finished sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
              <Award className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.avgScore || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of 100
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Session
              </CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground">
                {loading ? '...' : formatDate(stats.lastSession)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Most recent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Start New Interview</CardTitle>
                  <CardDescription>Begin a practice session</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose from technical, behavioral, or HR interview types
              </p>
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => navigate('/interview')}
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <CardTitle>View Progress</CardTitle>
                  <CardDescription>Track your improvement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                See detailed analytics and performance metrics
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/progress')}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resume Section */}
        <div className="mb-8">
          <ResumeUpload onUploadSuccess={fetchProfile} />
        </div>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : stats.totalSessions === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No sessions yet. Start your first interview practice!
                </p>
                <Button 
                  variant="hero"
                  onClick={() => navigate('/interview')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllSessions ? recentSessions : recentSessions.slice(0, 5)).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group"
                    onClick={() => {
                      const view = session.status === 'completed' ? 'results' : 'session';
                      navigate('/interview', { 
                        state: { 
                          sessionId: session.id, 
                          view,
                          interviewType: session.interview_type,
                          difficulty: session.difficulty_level
                        } 
                      });
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium capitalize transition-colors ${
                          session.status === 'completed' 
                            ? 'text-foreground group-hover:text-primary' 
                            : 'text-primary font-bold'
                        }`}>
                          {session.interview_type} Interview
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          session.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-primary/20 text-primary animate-pulse'
                        }`}>
                          {session.status === 'completed' ? 'Completed' : 'Resume →'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{session.difficulty_level} level</span>
                        <span>•</span>
                        <span>{formatDate(session.created_at)}</span>
                        {session.status === 'completed' && session.score && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              Score: {Math.round(session.score)}/100
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.status === 'completed' && (
                        <div className={`text-2xl font-bold ${
                          session.score >= 80 ? 'text-green-600' : 
                          session.score >= 60 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {Math.round(session.score)}%
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {recentSessions.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm"
                    onClick={() => setShowAllSessions(!showAllSessions)}
                  >
                    {showAllSessions ? "Show Less" : `View All Activity (${recentSessions.length})`}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Edit Personal Details
            </DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Enter your full name" 
                value={editFullName} 
                onChange={(e) => setEditFullName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                value={profile?.email || user?.email || ""} 
                disabled 
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Your email cannot be changed directly.</p>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-semibold mb-4 text-foreground">Change Password</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    placeholder="Minimum 8 characters" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    placeholder="Repeat new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this interview session? This will permanently remove your feedback, scores, and recommendations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CandidateDashboard;
