import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AI analyze my answers?",
    answer: "Our AI uses advanced natural language processing to evaluate multiple aspects of your response, including content relevance, structure, confidence level, grammar, and communication effectiveness. It compares your answers against proven frameworks and provides actionable feedback instantly.",
  },
  {
    question: "Can I practice technical interviews?",
    answer: "Absolutely! We offer specialized technical interview modules for software engineering, data science, system design, and more. The AI generates industry-specific questions and evaluates both your technical accuracy and problem-solving approach.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, security is our top priority. All your practice sessions and personal data are encrypted using bank-level security. We never share your information with third parties, and you can delete your data at any time.",
  },
  {
    question: "What types of interviews can I practice?",
    answer: "AI Interview Coach supports HR/behavioral interviews, technical interviews, case study interviews, situational interviews, and competency-based interviews. You can also customize question sets for specific companies or industries.",
  },
  {
    question: "How long does it take to see improvement?",
    answer: "Most users report noticeable improvement in confidence and communication within 1-2 weeks of regular practice. Our adaptive learning system ensures you're always challenged at the right level to maximize growth.",
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes! We offer a free tier that includes 5 practice sessions per month with basic feedback. Premium plans unlock unlimited sessions, advanced analytics, and personalized coaching recommendations.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about AI Interview Coach.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card rounded-2xl px-6 border-none"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
