import { Button } from "@/components/ui/button";
import { Play, BarChart3, MessageSquare, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const DemoPreviewSection = () => {
  return (
    <section id="demo" className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Live Preview
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience our intuitive interface and powerful AI features.
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Interview Questions Card */}
          <div className="glass-card rounded-3xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Interview Session</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Question 3 of 10</p>
                <p className="text-sm text-foreground">What's your greatest professional achievement?</p>
              </div>
              
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Recording...</span>
                </div>
                <p className="text-sm text-foreground">My greatest achievement was leading the digital transformation project...</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full gradient-bg rounded-full" />
                </div>
                <span className="text-xs text-muted-foreground">3/10</span>
              </div>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="glass-card rounded-3xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Performance Analytics</h3>
            </div>
            
            <div className="space-y-4">
              {/* Chart Placeholder */}
              <div className="h-24 flex items-end gap-2 px-2">
                {[40, 65, 55, 80, 70, 85, 90].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--secondary)))`,
                    }}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold gradient-text">87%</p>
                  <p className="text-xs text-muted-foreground">Avg. Score</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold gradient-text">+15%</p>
                  <p className="text-xs text-muted-foreground">Improvement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Card */}
          <div className="glass-card rounded-3xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">AI Feedback</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                <span className="text-sm text-foreground">Confidence</span>
                <span className="text-sm font-semibold text-green-600">Excellent</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                <span className="text-sm text-foreground">Content</span>
                <span className="text-sm font-semibold text-primary">Strong</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10">
                <span className="text-sm text-foreground">Structure</span>
                <span className="text-sm font-semibold text-yellow-600">Good</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                <span className="text-sm text-foreground">Grammar</span>
                <span className="text-sm font-semibold text-green-600">Perfect</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="xl" className="group" asChild>
            <Link to="/login">
              <Play className="w-5 h-5" />
              Try the Demo Interview
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
