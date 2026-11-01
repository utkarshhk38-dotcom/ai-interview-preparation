import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[calc(100vh-4rem)] py-12">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/20 mb-8 animate-fade-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered Interview Practice</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up delay-100">
              Ace Every Interview with Your Personal{" "}
              <span className="gradient-text">AI Interview Coach</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up delay-200">
              Practice real interview scenarios, get instant AI-powered feedback, and track your progress—anytime, anywhere.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-up delay-300">
              <Button variant="hero" size="xl" className="group" asChild>
                <Link to="/login">
                  Start Practicing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" className="group" asChild>
                <a href="#demo">
                  <Play className="w-5 h-5" />
                  View Demo
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start animate-fade-up delay-400">
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">50K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">95%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">4.9★</p>
                <p className="text-sm text-muted-foreground">User Rating</p>
              </div>
            </div>
          </div>

          {/* Right - Illustration */}
          <div className="flex-1 relative animate-fade-up delay-200">
            <div className="relative w-full max-w-lg mx-auto">
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-6 card-shadow animate-float">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Interview Assistant</h3>
                    <p className="text-sm text-muted-foreground">Ready to help you practice</p>
                  </div>
                </div>
                
                {/* Chat Preview */}
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                    <p className="text-sm text-foreground">Tell me about a time when you had to lead a team through a challenging project.</p>
                  </div>
                  <div className="bg-primary/10 rounded-2xl rounded-tr-sm p-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-foreground">In my previous role, I led a cross-functional team of 8 people...</p>
                  </div>
                </div>

                {/* Input Preview */}
                <div className="mt-4 flex items-center gap-2 bg-muted/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                  </div>
                  <span className="text-sm text-muted-foreground">Listening to your response...</span>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 glass-card rounded-2xl p-4 card-shadow animate-fade-in delay-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Confidence</p>
                    <p className="text-sm font-bold text-green-500">92%</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 glass-card rounded-2xl p-4 card-shadow animate-fade-in delay-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-lg">📊</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Score</p>
                    <p className="text-sm font-bold gradient-text">8.5/10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
