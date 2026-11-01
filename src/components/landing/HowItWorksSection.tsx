import { UserPlus, ListChecks, Mic, FileCheck, LineChart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Login / Sign Up",
    description: "Create your account in seconds with email or social login.",
    step: "01",
  },
  {
    icon: ListChecks,
    title: "Choose Interview Type",
    description: "Select from HR, Technical, or Behavioral interview categories.",
    step: "02",
  },
  {
    icon: Mic,
    title: "Answer AI Questions",
    description: "Practice with realistic AI-generated questions tailored to you.",
    step: "03",
  },
  {
    icon: FileCheck,
    title: "Receive Detailed Feedback",
    description: "Get instant analysis on your responses with improvement tips.",
    step: "04",
  },
  {
    icon: LineChart,
    title: "Track Your Progress",
    description: "Monitor your improvement over time with detailed analytics.",
    step: "05",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in minutes and begin your journey to interview success.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 hidden lg:block" style={{ transform: 'translateY(-50%)' }} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors z-0">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="relative z-10 w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-4 text-primary/30">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
