import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    image: "SC",
    content: "AI Interview Coach transformed my interview preparation. The real-time feedback helped me identify and fix my weaknesses. I went from failing interviews to landing my dream job!",
    rating: 5,
  },
  {
    name: "Michael Roberts",
    role: "Product Manager at Meta",
    image: "MR",
    content: "The behavioral interview practice was incredible. The AI asked questions I actually faced in my real interviews. Best investment I made for my career.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Data Analyst at Amazon",
    image: "EW",
    content: "I was skeptical at first, but the personalized recommendations and progress tracking kept me motivated. My confidence improved dramatically after just 2 weeks.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "UX Designer at Apple",
    image: "DK",
    content: "The instant feedback on my communication skills was eye-opening. I didn't realize how many filler words I used until the AI pointed it out. Game changer!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users have to say about their experience with AI Interview Coach.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group glass-card rounded-2xl p-6 hover:card-shadow transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-primary/20 mb-4" />

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {testimonial.image}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
