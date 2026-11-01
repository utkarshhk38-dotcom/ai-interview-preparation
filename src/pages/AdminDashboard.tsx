import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, UserStatus, supabase, isAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  FileText, 
  TrendingUp, 
  LogOut,
  UserCheck,
  Clock,
  AlertTriangle,
  Award,
  Activity,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  Eye,
  MapPin,
  GraduationCap,
  Linkedin,
  Github
} from "lucide-react";

interface DashboardStats {
  totalCandidates: number;
  totalSessions: number;
  totalQuestions: number;
  avgScore: number;
  activeSessions: number;
  completedSessions: number;
}

interface DashboardAnalytics {
  scoreTrend: number;
  activeUsers7Days: number;
  flaggedResponses: number;
  pendingReviews: number;
  bestCategory: string;
  bestCategoryScore: number;
  worstCategory: string;
  worstCategoryScore: number;
}

interface RecentCandidate {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface RecentSession {
  id: string;
  candidate_email: string;
  candidate_name?: string;
  interview_type: string;
  difficulty_level: string;
  status: string;
  score: number | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return (location.state as any)?.defaultTab || "overview";
  });
  const [stats, setStats] = useState<DashboardStats>(() => {
    const cached = localStorage.getItem('admin_stats');
    return cached ? JSON.parse(cached) : {
      totalCandidates: 0,
      totalSessions: 0,
      totalQuestions: 0,
      avgScore: 0,
      activeSessions: 0,
      completedSessions: 0,
    };
  });
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(() => {
    const cached = localStorage.getItem('admin_analytics');
    return cached ? JSON.parse(cached) : {
      scoreTrend: 0,
      activeUsers7Days: 0,
      flaggedResponses: 0,
      pendingReviews: 0,
      bestCategory: "",
      bestCategoryScore: 0,
      worstCategory: "",
      worstCategoryScore: 0,
    };
  });
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>(() => {
    const cached = localStorage.getItem('admin_recent_candidates');
    return cached ? JSON.parse(cached) : [];
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>(() => {
    const cached = localStorage.getItem('admin_recent_sessions');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionsSearchTerm, setSessionsSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sessionFilterType, setSessionFilterType] = useState("all");
  const [isSearchingSessions, setIsSearchingSessions] = useState(false);
  const [visibleSessionsCount, setVisibleSessionsCount] = useState(10);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [loadingUserSessions, setLoadingUserSessions] = useState(false);
  
  // Profile editing state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setEditFullName(data.full_name || "");
      }
    } catch (err) {
      console.error('AdminDashboard: Error fetching profile:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      // Update full name in profiles table
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


  useEffect(() => {
    if (authLoading || !user || userRole !== UserRole.ADMIN) return;
    
    const initializeAdmin = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchQuestions(),
          fetchProfile(),
          fetchAllUsers()
        ]);
      } catch (error) {
        console.error("Admin initialization error:", error);
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }

    };

    initializeAdmin();
  }, [user, userRole, authLoading]);

  const { toast } = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Failsafe: Ensure loading is eventually cleared even if fetch hangs
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading && mounted.current) {
          console.warn('AdminDashboard: Loading timed out, forcing display');
          setLoading(false);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "technical",
    difficulty_level: "beginner",
    category: "",
    tags: "",
    sample_answer: "",
  });

  // Real-time server-side search for sessions
  useEffect(() => {
    if (authLoading || !user || userRole !== UserRole.ADMIN) return;
    
    const searchSessions = async () => {
      if (!sessionsSearchTerm.trim() && sessionFilterType === 'all') {
        fetchDashboardData();
        return;
      }

      setIsSearchingSessions(true);
      try {
        let query = supabase
          .from('interview_sessions')
          .select(`
            id,
            candidate_id,
            interview_type,
            difficulty_level,
            status,
            score,
            created_at,
            candidate:profiles(id, email, full_name)
          `)
          .order('created_at', { ascending: false });

        if (sessionFilterType !== 'all') {
          query = query.eq('status', sessionFilterType);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filteredData = data || [];
        
        // Post-filter for candidate name/email since Supabase doesn't support easy deep joins for search without RPC
        if (sessionsSearchTerm.trim()) {
          const term = sessionsSearchTerm.toLowerCase();
          filteredData = filteredData.filter((s: any) => 
            s.candidate?.email?.toLowerCase().includes(term) ||
            s.candidate?.full_name?.toLowerCase().includes(term) ||
            s.interview_type?.toLowerCase().includes(term)
          );
        }

        setRecentSessions(
          filteredData.map((s: any) => ({
            ...s,
            candidate_email: s.candidate?.email || 'Unknown',
            candidate_name: s.candidate?.full_name || 'No name',
            candidate_data: s.candidate || null,
          }))
        );
      } catch (error) {
        console.error('Error searching sessions:', error);
      } finally {
        setIsSearchingSessions(false);
      }
    };

    const timeoutId = setTimeout(searchSessions, 500);
    return () => clearTimeout(timeoutId);
  }, [sessionsSearchTerm, sessionFilterType, user, userRole, authLoading]);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${newStatus === UserStatus.BLOCKED ? 'blocked' : 'unblocked'} successfully`,
      });
      
      // Update local state to reflect changes
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (viewingUser?.id === userId) {
        setViewingUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      let errorMessage = error.message;
      
      // Handle the case where the status column is missing
      if (error.code === '42703' || error.message?.includes('status')) {
        errorMessage = "The 'status' column is missing in your database. Please run the SQL migration script in your Supabase SQL Editor.";
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            full_name: newAdmin.full_name,
            role: UserRole.ADMIN,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Admin Account Created",
        description: "The admin account has been created. IMPORTANT: If email confirmation is enabled in your Supabase settings, the new admin must confirm their email before they can log in.",
      });
      setShowAddAdmin(false);
      setNewAdmin({ email: "", password: "", full_name: "" });
      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || userRole !== UserRole.ADMIN) {
      navigate("/login");
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchAllUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at')
        .order('created_at', { ascending: false });
      
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .insert([{
          ...newQuestion,
          tags: newQuestion.tags.split(',').map(t => t.trim()),
          created_by: user?.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully",
      });

      setShowAddQuestion(false);
      setNewQuestion({
        question_text: "",
        question_type: "technical",
        difficulty_level: "beginner",
        category: "",
        tags: "",
        sample_answer: "",
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion({
      ...question,
      tags: Array.isArray(question.tags) ? question.tags.join(', ') : (question.tags || '')
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: editingQuestion.question_text,
          question_type: editingQuestion.question_type,
          difficulty_level: editingQuestion.difficulty_level,
          category: editingQuestion.category,
          tags: typeof editingQuestion.tags === 'string' 
            ? editingQuestion.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : editingQuestion.tags,
          sample_answer: editingQuestion.sample_answer,
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully",
      });

      setEditingQuestion(null);
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleQuestionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Question ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Parallelize all initial fetches for better performance
      const [
        { count: candidatesCount },
        { count: sessionsCount },
        { count: questionsCount },
        { data: allSessions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
        supabase.from('interview_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('interview_sessions').select('score, interview_type, created_at, status, candidate_id')
      ]);

      let avgScore = 0;
      let trend = 0;
      let active7d = 0;
      let flagged = 0;
      let pendingCount = 0;
      let completedCount = 0;
      let activeCount = 0;
      let bestCat = '';
      let bestScore = 0;
      let worstCat = '';
      let worstScore = 0;

      if (allSessions && allSessions.length > 0) {
        let totalScoreSum = 0;
        let totalScoreCount = 0;
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let recentScoreSum = 0, recentScoreCount = 0;
        let pastScoreSum = 0, pastScoreCount = 0;

        const categoryStats: Record<string, { sum: number, count: number }> = {};
        const activeUsersSet = new Set();

        allSessions.forEach(session => {
          const sessionDate = new Date(session.created_at);
          
          if (sessionDate >= sevenDaysAgo && session.candidate_id) {
            activeUsersSet.add(session.candidate_id);
          }

          if (session.status === 'pending' || session.status === 'in_progress') {
            activeCount++;
            pendingCount++;
          }
          
          if (session.status === 'completed') {
            completedCount++;
          }

          if (session.score !== null) {
            totalScoreSum += session.score;
            totalScoreCount++;
            
            if (session.score < 50) flagged++;

            if (sessionDate >= thirtyDaysAgo) {
              recentScoreSum += session.score;
              recentScoreCount++;
            } else if (sessionDate >= sixtyDaysAgo) {
              pastScoreSum += session.score;
              pastScoreCount++;
            }

            const type = session.interview_type || 'general';
            if (!categoryStats[type]) categoryStats[type] = { sum: 0, count: 0 };
            categoryStats[type].sum += session.score;
            categoryStats[type].count++;
          }
        });

        active7d = activeUsersSet.size;
        avgScore = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : 0;

        const recentAvg = recentScoreCount > 0 ? recentScoreSum / recentScoreCount : 0;
        const pastAvg = pastScoreCount > 0 ? pastScoreSum / pastScoreCount : 0;
        if (pastAvg > 0) {
          trend = Math.round(((recentAvg - pastAvg) / pastAvg) * 100);
        } else if (recentAvg > 0) {
          trend = 100;
        }

        let maxAvg = -1;
        let minAvg = 101;

        Object.keys(categoryStats).forEach(cat => {
          const avg = categoryStats[cat].sum / categoryStats[cat].count;
          if (avg > maxAvg) {
            maxAvg = avg;
            bestCat = cat;
            bestScore = Math.round(avg);
          }
          if (avg < minAvg) {
            minAvg = avg;
            worstCat = cat;
            worstScore = Math.round(avg);
          }
        });
      }
      
      const newAnalytics = {
        scoreTrend: trend,
        activeUsers7Days: active7d,
        flaggedResponses: flagged,
        pendingReviews: pendingCount,
        bestCategory: bestCat,
        bestCategoryScore: bestScore,
        worstCategory: worstCat,
        worstCategoryScore: worstScore,
      };
      setAnalytics(newAnalytics);
      localStorage.setItem('admin_analytics', JSON.stringify(newAnalytics));

      // Fetch recent candidates and sessions in parallel
      const [
        { data: candidatesData },
        { data: sessionsData }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .eq('role', 'candidate')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('interview_sessions')
          .select(`
            id,
            candidate_id,
            interview_type,
            difficulty_level,
            status,
            score,
            created_at,
            candidate:profiles(id, email, full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const newStats = {
        totalCandidates: candidatesCount || 0,
        totalSessions: sessionsCount || 0,
        totalQuestions: questionsCount || 0,
        avgScore: Math.round(avgScore * 10) / 10,
        activeSessions: activeCount || 0,
        completedSessions: completedCount || 0,
      };
      setStats(newStats);
      localStorage.setItem('admin_stats', JSON.stringify(newStats));

      setRecentCandidates(candidatesData || []);
      localStorage.setItem('admin_recent_candidates', JSON.stringify(candidatesData || []));

      const processedSessions = sessionsData?.map((s: any) => ({
        ...s,
        candidate_email: s.candidate?.email || 'Unknown',
        candidate_name: s.candidate?.full_name || 'No name',
        candidate_data: s.candidate || null,
      })) || [];
      
      setRecentSessions(processedSessions);
      localStorage.setItem('admin_recent_sessions', JSON.stringify(processedSessions));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }

  };


  const handleViewSession = (session: RecentSession) => {
    navigate('/interview', { 
      state: { 
        sessionId: session.id, 
        view: 'results',
        interviewType: session.interview_type,
        difficulty: (session as any).difficulty_level,
        returnTab: 'sessions'
      } 
    });
  };

  const fetchUserActivity = async (targetUser: any) => {
    setViewingUser(targetUser);
    setLoadingUserSessions(true);
    try {
      console.log('AdminDashboard: Fetching activity for', targetUser.email);
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('candidate_id', targetUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserSessions(data || []);
    } catch (error: any) {
      console.error('AdminDashboard: User activity error', error);
      toast({
        title: "Error",
        description: "Failed to fetch user activity history.",
        variant: "destructive",
      });
    } finally {
      setLoadingUserSessions(false);
    }
  };

  const handleExportQuestions = () => {
    try {
      console.log('AdminDashboard: Exporting questions...');
      const dataStr = JSON.stringify(questions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `interview_questions_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export Successful",
        description: "Your question bank has been exported as a JSON file.",
      });
    } catch (error) {
      console.error('AdminDashboard: Export error', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting questions.",
        variant: "destructive",
      });
    }
  };

  const handleImportQuestions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        if (!Array.isArray(importedData)) {
          throw new Error("Invalid file format. Expected an array of questions.");
        }

        setLoading(true);
        
        // Prepare data for insertion (strip IDs and timestamps if present)
        const cleanedData = importedData.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type || 'technical',
          difficulty_level: q.difficulty_level || 'intermediate',
          category: q.category || '',
          tags: Array.isArray(q.tags) ? q.tags : (typeof q.tags === 'string' ? q.tags.split(',').map((t: string) => t.trim()) : []),
          sample_answer: q.sample_answer || '',
          is_active: q.is_active !== undefined ? q.is_active : true,
          created_by: user?.id
        }));

        const { error } = await supabase
          .from('questions')
          .insert(cleanedData);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `${cleanedData.length} questions have been imported.`,
        });
        
        fetchQuestions();
      } catch (error: any) {
        console.error('AdminDashboard: Import error', error);
        toast({
          title: "Import Failed",
          description: error.message || "Failed to parse the file. Ensure it is a valid JSON array of questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
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
              <h1 className="font-bold text-lg text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="heroOutline" size="sm" onClick={() => setIsEditDialogOpen(true)} className="gap-2">
              <Edit className="w-4 h-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </Button>
            <Button variant="heroOutline" size="sm" onClick={handleSignOut} className="gap-2 hover:border-destructive/50 hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Admin Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal details and password.
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

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="glass-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Question
            </DialogTitle>
            <DialogDescription>
              Modify the question details below.
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Question Text</Label>
                <Textarea
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                  placeholder="Enter the interview question..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editingQuestion.question_type}
                    onValueChange={(value) => setEditingQuestion({...editingQuestion, question_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={editingQuestion.difficulty_level}
                    onValueChange={(value) => setEditingQuestion({...editingQuestion, difficulty_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editingQuestion.category || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion, category: e.target.value})}
                    placeholder="e.g., JavaScript, Leadership"
                  />
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={editingQuestion.tags || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion, tags: e.target.value})}
                    placeholder="e.g., react, hooks, state"
                  />
                </div>
              </div>
              <div>
                <Label>Sample Answer (Optional)</Label>
                <Textarea
                  value={editingQuestion.sample_answer || ''}
                  onChange={(e) => setEditingQuestion({...editingQuestion, sample_answer: e.target.value})}
                  placeholder="Provide a sample answer..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button onClick={handleUpdateQuestion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Candidates
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.totalCandidates}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
              <Activity className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Interview sessions
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
                Active Sessions
              </CardTitle>
              <Clock className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '...' : stats.activeSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="glass-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="questions">Question Bank</TabsTrigger>
            <TabsTrigger value="candidates">Recent Candidates</TabsTrigger>
            <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Quick Statistics
                  </CardTitle>
                  <CardDescription>Platform performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Sessions</span>
                    <span className="text-lg font-semibold text-foreground">
                      {stats.completedSessions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Questions</span>
                    <span className="text-lg font-semibold text-foreground">
                      {stats.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-lg font-semibold text-foreground">
                      {stats.totalSessions > 0
                        ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    System Information
                  </CardTitle>
                  <CardDescription>Platform details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admin Email</span>
                    <span className="text-sm font-medium text-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <span className="text-sm font-medium text-foreground">Administrator</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage all registered users</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="hero" size="sm" onClick={() => setShowAddAdmin(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showAddAdmin && (
                  <div className="mb-6 p-6 border border-primary/20 rounded-xl bg-card/50 backdrop-blur-sm">
                    <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Create New Admin Account
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-name">Full Name</Label>
                        <Input
                          id="admin-name"
                          placeholder="John Doe"
                          value={newAdmin.full_name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@example.com"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="••••••••"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={handleAddAdmin} className="gradient-bg border-0">
                        Create Admin Account
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
                        Cancel
                      </Button>
                      <p className="text-xs text-muted-foreground italic">
                        Note: New admins will be able to log in immediately after creation.
                      </p>
                    </div>
                  </div>
                )}

                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-4 p-3 bg-muted/50 rounded-lg font-semibold text-sm">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Status</div>
                      <div>Joined</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                    {allUsers
                      .filter(u => 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          className="grid grid-cols-7 gap-4 p-4 rounded-lg bg-card hover:bg-accent/5 transition-colors items-center"
                        >
                          <div className="font-medium">{u.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          <div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              u.role === 'admin' 
                                ? "bg-purple-100 text-purple-700 border border-purple-200" 
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            )}>
                              {u.role}
                            </span>
                          </div>
                          <div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              u.status === UserStatus.BLOCKED 
                                ? "bg-red-100 text-red-700 border border-red-200" 
                                : "bg-green-100 text-green-700 border border-green-200"
                            )}>
                              {u.status || 'active'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 flex gap-2">
                            {u.id !== user?.id ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateUserRole(u.id, u.role === 'admin' ? 'candidate' : 'admin')}
                                  className={u.role === 'admin' ? "text-orange-600 hover:text-orange-700" : "text-purple-600 hover:text-purple-700"}
                                >
                                  {u.role === 'admin' ? 'Demote' : 'Promote'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(u.id, u.status || 'active')}
                                  className={u.status === UserStatus.BLOCKED ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                                >
                                  {u.status === UserStatus.BLOCKED ? 'Unblock' : 'Block'}
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic py-1 px-2">Current Session</span>
                            )}
                             <Button 
                               variant="outline" 
                               size="sm"
                               className="hover:bg-primary/5 border-primary/20"
                               onClick={() => fetchUserActivity(u)}
                             >
                               <Eye className="w-4 h-4 mr-1 text-primary" />
                               View
                             </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary" />
                      Question Bank Management
                    </CardTitle>
                    <CardDescription>Add, edit, and manage interview questions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="import-questions"
                      className="hidden"
                      accept=".json"
                      onChange={handleImportQuestions}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('import-questions')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportQuestions}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="hero" size="sm" onClick={() => setShowAddQuestion(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showAddQuestion && (
                  <div className="mb-6 p-4 border border-border rounded-lg bg-card">
                    <h3 className="font-semibold mb-4">Add New Question</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Question Text</Label>
                        <Textarea
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                          placeholder="Enter the interview question..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={newQuestion.question_type}
                            onValueChange={(value) => setNewQuestion({...newQuestion, question_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="behavioral">Behavioral</SelectItem>
                              <SelectItem value="hr">HR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            value={newQuestion.difficulty_level}
                            onValueChange={(value) => setNewQuestion({...newQuestion, difficulty_level: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={newQuestion.category}
                            onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                            placeholder="e.g., JavaScript, Leadership"
                          />
                        </div>
                        <div>
                          <Label>Tags (comma-separated)</Label>
                          <Input
                            value={newQuestion.tags}
                            onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                            placeholder="e.g., react, hooks, state"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Sample Answer (Optional)</Label>
                        <Textarea
                          value={newQuestion.sample_answer}
                          onChange={(e) => setNewQuestion({...newQuestion, sample_answer: e.target.value})}
                          placeholder="Provide a sample answer..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddQuestion}>Add Question</Button>
                        <Button variant="outline" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : questions.length === 0 ? (
                  <p className="text-muted-foreground">No questions found</p>
                ) : (
                  <div className="space-y-4">
                    {questions
                      .filter(q => filterType === 'all' || q.question_type === filterType)
                      .map((question) => (
                        <div
                          key={question.id}
                          className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary capitalize">
                                  {question.question_type}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary capitalize">
                                  {question.difficulty_level}
                                </span>
                                {!question.is_active && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="font-medium mb-2">{question.question_text}</p>
                              {question.category && (
                                <p className="text-sm text-muted-foreground">Category: {question.category}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleQuestionStatus(question.id, question.is_active)}
                              >
                                {question.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Recent Candidates
                </CardTitle>
                <CardDescription>Latest registered candidates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : recentCandidates.length === 0 ? (
                  <p className="text-muted-foreground">No candidates yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {candidate.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(candidate.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Latest interview sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sessions by candidate email or name..."
                      value={sessionsSearchTerm}
                      onChange={(e) => setSessionsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sessionFilterType} onValueChange={setSessionFilterType}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading || isSearchingSessions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Searching sessions...</p>
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No sessions found matching your criteria</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {recentSessions.slice(0, visibleSessionsCount).map((session) => (
                          <div
                            key={session.id}
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all"
                          >
                            <div 
                              className="flex-1 space-y-1 cursor-pointer"
                              onClick={() => handleViewSession(session)}
                            >
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg capitalize text-foreground group-hover:text-primary transition-colors">
                                  {session.interview_type.replace('_', ' ')}
                                </h4>
                                <Badge variant="outline" className="text-[10px] uppercase h-5">
                                  {(session as any).difficulty_level || 'standard'}
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                                <div 
                                  className="flex items-center gap-1 font-medium text-foreground/80 hover:text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if ((session as any).candidate_data) {
                                      fetchUserActivity((session as any).candidate_data);
                                    }
                                  }}
                                >
                                  <Users className="w-3 h-3" />
                                  {(session as any).candidate_name}
                                </div>
                                <span className="hidden sm:inline opacity-30">•</span>
                                <p className="text-xs truncate max-w-[200px]">{session.candidate_email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <div className="flex items-center sm:justify-end gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    session.status === 'completed' ? "bg-green-500" : "bg-amber-500"
                                  )} />
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {session.status}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 sm:justify-end">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(session.created_at)}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div 
                                  className="text-center px-4 py-1 bg-primary/5 rounded-lg border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                                  onClick={() => handleViewSession(session)}
                                >
                                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Score</p>
                                  <p className={cn(
                                    "text-xl font-black",
                                    session.score ? "text-primary" : "text-muted-foreground/30"
                                  )}>
                                    {session.score ? `${session.score}%` : '--'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleViewSession(session)}
                                    title="View Performance"
                                  >
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      if ((session as any).candidate_data) {
                                        fetchUserActivity((session as any).candidate_data);
                                      }
                                    }}
                                    title="View User History"
                                  >
                                    <Users className="w-4 h-4 text-secondary" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-3 pt-4 border-t border-border/50">
                      {visibleSessionsCount < recentSessions.length ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setVisibleSessionsCount(prev => prev + 10)}
                          className="px-8 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          Show More Sessions ({recentSessions.length - visibleSessionsCount} remaining)
                        </Button>
                      ) : recentSessions.length > 10 && (
                        <Button 
                          variant="outline" 
                          onClick={() => setVisibleSessionsCount(10)}
                          className="px-8 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          Show Less
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Interview Reports & Analytics
                </CardTitle>
                <CardDescription>Comprehensive platform analytics and AI feedback monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average Score Trend (30d)</span>
                          <span className={cn(
                            "text-lg font-semibold",
                            analytics.scoreTrend > 0 ? "text-green-600" : analytics.scoreTrend < 0 ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {loading ? '...' : (analytics.scoreTrend > 0 ? '↑' : analytics.scoreTrend < 0 ? '↓' : '') + ' ' + Math.abs(analytics.scoreTrend) + '%'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Completion Rate</span>
                          <span className="text-lg font-semibold">
                            {stats.totalSessions > 0
                              ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Users (7 days)</span>
                          <span className="text-lg font-semibold">{analytics.activeUsers7Days}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-secondary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Feedback Monitoring</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Flagged Responses (Score &lt; 50)</span>
                          <span className="text-lg font-semibold text-orange-600">{analytics.flaggedResponses}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">NLP Reports Generated</span>
                          <span className="text-lg font-semibold">{stats.completedSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Pending / In Progress</span>
                          <span className="text-lg font-semibold">{analytics.pendingReviews}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analytics.bestCategory || analytics.worstCategory ? (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4 text-foreground/80">Category Performance Insights</h3>
                    <div className="space-y-3">
                      {analytics.worstCategory && (
                        <div className="p-4 border border-border/50 bg-destructive/5 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold capitalize text-destructive flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Most Challenging: {analytics.worstCategory.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-black text-destructive/80">Avg Score: {analytics.worstCategoryScore}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Candidates generally score lower in this category. Data indicates a need for more practice resources or curriculum review for {analytics.worstCategory.replace('_', ' ')} sessions.
                          </p>
                        </div>
                      )}
                      {analytics.bestCategory && (
                        <div className="p-4 border border-border/50 bg-green-500/5 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold capitalize text-green-600 flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Best Performing: {analytics.bestCategory.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-black text-green-600/80">Avg Score: {analytics.bestCategoryScore}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This is currently the strongest category across the platform. Candidates perform consistently well in {analytics.bestCategory.replace('_', ' ')} interviews.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !loading && (
                  <div className="mt-6 p-12 text-center border border-dashed border-border rounded-xl">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">Insufficient data to generate category insights yet.</p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> Data shown is computed from actual interview sessions across the platform. Real-time updates may take a few minutes to reflect.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Activity Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <UserCheck className="w-6 h-6 text-primary" />
                  User Profile: {viewingUser?.full_name || 'N/A'}
                </DialogTitle>
                <DialogDescription>
                  Profile details and activity history for {viewingUser?.email}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {viewingUser?.id !== user?.id && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleUserStatus(viewingUser?.id, viewingUser?.status || 'active')}
                    className={viewingUser?.status === UserStatus.BLOCKED ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}
                  >
                    {viewingUser?.status === UserStatus.BLOCKED ? 'Unblock User' : 'Block User'}
                  </Button>
                )}
                <Badge className={cn(
                  "px-3 py-1 uppercase text-[10px] tracking-widest",
                  viewingUser?.status === UserStatus.BLOCKED ? "bg-red-500" : "bg-green-500"
                )}>
                  {viewingUser?.status || 'active'}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Profile Info Side Card */}
            <div className="space-y-4">
              <Card className="bg-muted/30 border-none shadow-none p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Role</Label>
                    <p className="font-semibold capitalize text-foreground">{viewingUser?.role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Joined On</Label>
                    <p className="text-sm font-medium">{viewingUser?.created_at ? formatDate(viewingUser.created_at) : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Location</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {viewingUser?.location || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Job Title</Label>
                    <p className="text-sm font-medium">{viewingUser?.job_title || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Experience</Label>
                    <p className="text-sm font-medium">{viewingUser?.experience_years ? `${viewingUser.experience_years} years` : 'N/A'}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-secondary" />
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingUser?.skills && viewingUser.skills.length > 0 ? (
                    viewingUser.skills.map((s: string) => (
                      <Badge key={s} variant="secondary" className="bg-secondary/10 text-secondary border-none">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No skills listed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Bio / Professional Summary
                  </h4>
                  <div className="p-4 rounded-xl bg-accent/5 border border-border text-sm leading-relaxed whitespace-pre-wrap italic">
                    {viewingUser?.bio || "No professional summary provided."}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-accent" />
                    Education
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
                    {viewingUser?.education || "Education details not available."}
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  {viewingUser?.linkedin_url && (
                    <a href={viewingUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                      <Linkedin className="w-3 h-3" />
                      LinkedIn Profile
                    </a>
                  )}
                  {viewingUser?.github_url && (
                    <a href={viewingUser.github_url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline text-xs flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      GitHub Profile
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <h4 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Interview Activity
                </h4>
                {loadingUserSessions ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-xs text-muted-foreground">Loading activity history...</p>
                  </div>
                ) : userSessions.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-sm text-muted-foreground">No interview sessions found for this candidate.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userSessions.slice(0, 5).map((session) => (
                      <div 
                        key={session.id} 
                        onClick={() => handleViewSession(session)}
                        className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <h5 className="font-bold text-sm group-hover:text-primary transition-colors capitalize">
                            {session.interview_type} Interview
                          </h5>
                          <p className="text-[10px] text-muted-foreground">{new Date(session.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-black text-primary">{session.score ? `${session.score}%` : 'N/A'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{session.status}</p>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                    {userSessions.length > 5 && (
                      <p className="text-center text-[10px] text-muted-foreground italic">Viewing 5 most recent sessions</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
