import { 
  MessageSquare, 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  Lightbulb, 
  Settings 
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description: "Simulated HR, Technical, and Behavioral interviews tailored to your industry and role.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "Smart Question Generation",
    description: "Dynamic AI-generated questions based on difficulty level and your progress.",
    color: "secondary",
  },
  {
    icon: BarChart3,
    title: "Instant Feedback Analysis",
    description: "Real-time evaluation of tone, confidence, grammar, and content accuracy.",
    color: "accent",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "Comprehensive dashboard with progress charts, scores, and improvement insights.",
    color: "primary",
  },
  {
    icon: Lightbulb,
    title: "Personalized Recommendations",
    description: "AI-suggested sample answers and tailored improvement tips for your weak areas.",
    color: "secondary",
  },
  {
    icon: Settings,
    title: "Admin Dashboard",
    description: "Manage users, customize questions, and access detailed analytics.",
    color: "accent",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our AI-powered platform provides comprehensive tools to help you prepare for any interview scenario with confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 hover:card-shadow transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                feature.color === "primary" 
                  ? "bg-primary/10" 
                  : feature.color === "secondary" 
                  ? "bg-secondary/10" 
                  : "bg-accent/10"
              }`}>
                <feature.icon className={`w-7 h-7 ${
                  feature.color === "primary" 
                    ? "text-primary" 
                    : feature.color === "secondary" 
                    ? "text-secondary" 
                    : "text-accent"
                }`} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:gradient-text transition-all">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
