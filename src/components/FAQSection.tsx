import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does the AI matching work?",
    answer: "Our AI analyzes your music's genre, mood, tempo, and instruments. Then it searches our database of 15,000+ viral videos to find content that succeeded with similar sounds. You get ideas proven to work for your exact vibe.",
  },
  {
    question: "What makes an 'outlier' video?",
    answer: "An outlier is a video that massively outperformed expectations. We look for smaller creators whose videos got 10x or more their usual views — these unexpected breakouts reveal what's actually working right now.",
  },
  {
    question: "Can I use this for any music genre?",
    answer: "Yes! Wavebound works across all genres — Hip-Hop, Pop, Electronic, R&B, Country, Rock, Latin, and more. Our AI understands the nuances of each genre and matches accordingly.",
  },
  {
    question: "How often is the content library updated?",
    answer: "Daily. We analyze TikTok and Instagram every day for new viral content, tag it, and add it to our library. You're always seeing what's working right now.",
  },
  {
    question: "Do I need any technical skills?",
    answer: "Not at all. Just upload your song or pick your genre, and we handle the rest. Our AI assistant can also guide you through strategy, answer questions, and help you build content plans conversationally.",
  },
  {
    question: "How much does it cost?",
    answer: "We have a free-forever tier because we genuinely want to help artists succeed — even though it costs us to run. For features that require more resources (like unlimited audio analysis), we offer affordable paid plans.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 px-6 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium uppercase tracking-wide mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Questions? <span className="bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">Answers.</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to know about Wavebound.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left"
              >
                <div className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 ${
                  openIndex === index 
                    ? 'border-sky-300 dark:border-sky-500/40 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between p-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white pr-6">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        openIndex === index ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={false}
                    animate={{
                      height: openIndex === index ? 'auto' : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-foreground/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Support email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 text-center"
        >
          <p className="text-foreground/60 text-sm">
            Still have questions?{" "}
            <a 
              href="mailto:support@wavebound.ai" 
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              support@wavebound.ai
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
