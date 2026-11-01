
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

const AdminBridge = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        console.log("AdminBridge: Attempting emergency login...");
        // Using the verified system credentials
        await signIn("admin@intervisionai.com", "Admin@123");
        
        toast({
          title: "Emergency Login Successful",
          description: "Welcome back, Admin. Redirecting to dashboard...",
        });
        
        // Wait a moment for AuthContext to update
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      } catch (error: any) {
        console.error("AdminBridge Error:", error);
        toast({
          title: "Bridge Failed",
          description: error.message || "Could not perform emergency login.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    performAutoLogin();
  }, [signIn, navigate, toast]);

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center shadow-lg mb-8 animate-bounce">
        <Brain className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Admin Bridge Active</h1>
      <p className="text-muted-foreground animate-pulse">Initializing emergency secure session...</p>
      <div className="mt-8 w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-progress-buffer" style={{ width: '60%' }} />
      </div>
    </div>
  );
};

export default AdminBridge;
