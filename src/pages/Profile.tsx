import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Linkedin, 
  Github, 
  Award, 
  Save, 
  ArrowLeft,
  Plus,
  X,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    bio: "",
    experience_years: 0,
    location: "",
    linkedin_url: "",
    github_url: "",
    education: "",
    phone: ""
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id;
      }
      if (!currentUserId) return;

      // Add timeout wrapper for the query
      const fetchPromise = supabase
        .from('profiles')
        .select('full_name, job_title, bio, experience_years, location, linkedin_url, github_url, education, phone, skills, avatar_url')
        .eq('id', currentUserId)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          job_title: data.job_title || "",
          bio: data.bio || "",
          experience_years: data.experience_years || 0,
          location: data.location || "",
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          education: data.education || "",
          phone: data.phone || ""
        });
        setSkills(data.skills || []);
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: error.message === 'Request timeout' 
          ? "Profile loading timed out. Please refresh the page." 
          : "Failed to load profile details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id;
      }

      if (!currentUserId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload your photo.",
          variant: "destructive",
        });
        return;
      }

      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', currentUserId);

      try {
        const { getApiUrl } = await import("@/lib/api");
        const response = await fetch(getApiUrl('/api/user/upload-avatar'), {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          setAvatarUrl(data.avatarUrl);
          toast({
            title: "Success",
            description: "Profile photo updated!",
          });
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        toast({
          title: "Upload failed",
          description: err.message || "Failed to upload photo.",
          variant: "destructive",
        });
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let currentUserId = user?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your profile.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);

      if (error) throw error;

      toast({
        title: "Profile Saved",
        description: "Your details and skills have been updated. Your next interview will be tailored to these skills!",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient pb-12">
      {/* Navigation */}
      <nav className="glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">User Profile</h1>
                <p className="text-xs text-muted-foreground">Manage your skills & experience</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="gap-2 shadow-lg hover:shadow-primary/20 transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Card */}
          <Card className="glass-card overflow-hidden border-primary/20">
            <div className="h-32 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 relative">
              <div className="absolute inset-0 bg-grid-white/10" />
            </div>
            <CardContent className="relative pt-0">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-bg flex items-center justify-center">
                        <User className="w-16 h-16 text-primary-foreground" />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-background"
                  >
                    <Plus className="w-5 h-5" />
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <div className="text-center md:text-left pb-2 flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-1">{formData.full_name || "New Candidate"}</h2>
                  <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                    <Briefcase className="w-4 h-4" />
                    {formData.job_title || "Professional"}
                  </p>
                </div>
                <div className="flex gap-2 pb-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Personal Info */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Details
                  </CardTitle>
                  <CardDescription>Update your basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="full_name" 
                          name="full_name"
                          className="pl-10"
                          placeholder="John Doe" 
                          value={formData.full_name} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Current Job Title</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="job_title" 
                          name="job_title"
                          className="pl-10"
                          placeholder="Software Engineer" 
                          value={formData.job_title} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Summary / Bio</Label>
                    <Textarea 
                      id="bio" 
                      name="bio"
                      placeholder="Tell us about your professional journey..." 
                      className="min-h-[120px] resize-none"
                      value={formData.bio} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="experience_years" 
                          name="experience_years"
                          type="number"
                          className="pl-10"
                          placeholder="5" 
                          value={formData.experience_years} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          name="location"
                          className="pl-10"
                          placeholder="New York, USA" 
                          value={formData.location} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-secondary" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education Background</Label>
                    <Textarea 
                      id="education" 
                      name="education"
                      placeholder="e.g. Master of Science in Computer Science, MIT, 2020" 
                      className="min-h-[80px] resize-none"
                      value={formData.education} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent" />
                    Contact & Socials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          className="pl-10 bg-muted/50"
                          value={user?.email || ""} 
                          disabled 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="phone" 
                          name="phone"
                          className="pl-10"
                          placeholder="+1 (555) 000-0000" 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="linkedin_url" 
                          name="linkedin_url"
                          className="pl-10"
                          placeholder="linkedin.com/in/username" 
                          value={formData.linkedin_url} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github_url">GitHub URL</Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="github_url" 
                          name="github_url"
                          className="pl-10"
                          placeholder="github.com/username" 
                          value={formData.github_url} 
                          onChange={handleInputChange} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Skills & Contact */}
            <div className="space-y-8">
              <Card className="glass-card border-secondary/20 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    Skills & Expertise
                  </CardTitle>
                  <CardDescription>AI will use these to generate your questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <Input 
                      placeholder="Add a skill (e.g. React)" 
                      value={newSkill} 
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="bg-background/50"
                    />
                    <Button type="submit" size="icon" variant="secondary" className="shrink-0 shadow-md">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-2 min-h-[100px] p-3 rounded-xl bg-accent/5 border border-dashed border-border/50">
                    {skills.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center w-full pt-8 italic">No skills added yet.</p>
                    ) : (
                      skills.map((skill) => (
                        <Badge 
                          key={skill} 
                          className="px-3 py-1 flex items-center gap-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20 transition-colors cursor-default"
                        >
                          {skill}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Pro Tip
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Adding technical skills like "React", "Node.js", or "Python" helps our AI generate deep-dive technical questions for your sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
