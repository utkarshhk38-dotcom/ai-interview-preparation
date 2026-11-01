import { Zap, Brain, Shield, Clock, GraduationCap, Users } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Real-time AI Evaluation",
    description: "Get instant feedback as you practice",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "Questions adjust to your skill level",
  },
  {
    icon: Shield,
    title: "Bias-free Assessment",
    description: "Objective, consistent evaluation every time",
  },
  {
    icon: Clock,
    title: "24/7 Accessibility",
    description: "Practice anytime, anywhere you want",
  },
  {
    icon: GraduationCap,
    title: "For All Levels",
    description: "Students to seasoned professionals",
  },
  {
    icon: Users,
    title: "Industry Specific",
    description: "Tailored questions for your field",
  },
];

const WhyChooseUsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="flex-1 max-w-xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              The Smarter Way to{" "}
              <span className="gradient-text">Prepare</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our AI Interview Coach combines cutting-edge technology with proven interview techniques to give you the competitive edge you need.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Stats Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="glass-card rounded-3xl p-8 card-shadow">
              <h3 className="text-xl font-semibold mb-6 text-center text-foreground">
                Proven Results
              </h3>
              
              <div className="space-y-6">
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <p className="text-5xl font-bold gradient-text mb-2">95%</p>
                  <p className="text-muted-foreground">of users report improved confidence</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-foreground mb-1">3x</p>
                    <p className="text-xs text-muted-foreground">More callbacks</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-foreground mb-1">50K+</p>
                    <p className="text-xs text-muted-foreground">Success stories</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-card gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Join thousands of <br />successful users
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
