import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResumeQuestion {
  id: string;
  question: string;
  type: string;
  tip: string;
}

interface ResumeUploadProps {
  onUploadSuccess?: () => void;
}

const ResumeUpload = ({ onUploadSuccess }: ResumeUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<ResumeQuestion[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    if (user) {
      fetchResumeQuestions();
    }
  }, [user]);

  const fetchResumeQuestions = async () => {
    let currentUserId = user?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;

    try {
      const response = await fetch(getApiUrl(`/api/resume/questions/${currentUserId}`));
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
        setHasResume(data.hasResume);
      }
    } catch (error) {
      console.error("Error fetching resume questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["application/pdf"];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    let currentUserId = user?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload your resume.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", currentUserId);

    try {
      const response = await fetch(getApiUrl("/api/resume/upload"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Resume processed! Your profile has been automatically updated with your skills and experience.",
        });
        setQuestions(data.questions);
        setHasResume(true);
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process resume.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {hasResume ? "Update Your Resume" : "Resume Analysis"}
          </CardTitle>
          <CardDescription>
            {hasResume 
              ? "You've already uploaded a resume. You can upload a new one to refresh your preparation questions." 
              : "Upload your resume (.pdf) to get AI-powered interview questions tailored to your experience."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  file ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
                }`}
              >
                {file ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {file ? file.name : "Select Resume (PDF only)"}
                </span>
              </label>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full md:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {hasResume ? "Update & Analyze Resume" : "Analyze Resume"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadingQuestions ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : questions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              Suggested Preparation Questions
            </h3>
          </div>
          {questions.map((q, idx) => (
            <Card key={idx} className="glass-card hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-2 capitalize">
                  {q.type}
                </Badge>
                <CardTitle className="text-base leading-tight">
                  {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Preparation Tip
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {q.tip}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasResume ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No specific questions found. Try re-uploading your resume.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ResumeUpload;
