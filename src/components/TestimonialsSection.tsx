import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Independent Artist",
    avatar: "SC",
    quote: "Wavebound completely changed how I approach content. I went from posting randomly to having a strategic plan that actually converts to streams.",
    rating: 5,
    metric: "3x more streams"
  },
  {
    name: "Marcus Rivera",
    role: "Producer & Artist",
    avatar: "MR", 
    quote: "The AI matching is insane. It found content formats I never would have discovered on my own. My TikTok grew 400% in 3 months.",
    rating: 5,
    metric: "400% TikTok growth"
  },
  {
    name: "Jade Thompson",
    role: "Singer-Songwriter",
    avatar: "JT",
    quote: "As a camera-shy artist, I was struggling. Wavebound showed me so many creative formats that don't require me being on camera. Game changer!",
    rating: 5,
    metric: "First viral post"
  },
  {
    name: "Alex Kim",
    role: "Label A&R",
    avatar: "AK",
    quote: "We use Wavebound for all our roster. It saves our team hours of research and the content plans actually drive results.",
    rating: 5,
    metric: "10+ artists managed"
  },
  {
    name: "Luna Martinez",
    role: "Electronic Producer",
    avatar: "LM",
    quote: "The audio analysis is spot-on. It understood my sound better than I could describe it and found perfect reference content.",
    rating: 5,
    metric: "50K new followers"
  },
  {
    name: "David Park",
    role: "Hip-Hop Artist",
    avatar: "DP",
    quote: "Stopped guessing, started growing. Wavebound's profile audit showed me exactly what was working and what wasn't.",
    rating: 5,
    metric: "2M+ monthly views"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="px-6 py-12 bg-gray-900 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-amber-500/30"
          >
            <Star className="w-4 h-4 fill-amber-400" />
            Loved by Artists
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Artists are <span className="text-[#0EA5E9]">winning</span> with Wavebound
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of artists who've transformed their content strategy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all relative group"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-gray-700/50 group-hover:text-gray-600 transition-colors" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0EA5E9] to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                "{testimonial.quote}"
              </p>

              <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {testimonial.metric}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default TestimonialsSection;
