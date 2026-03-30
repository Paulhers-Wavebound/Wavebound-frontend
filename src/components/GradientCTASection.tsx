import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GradientCTASection = () => {
  return (
    <section className="py-16 px-6 relative overflow-hidden">
      {/* Full gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 60%)
            `,
            backgroundSize: '100% 100%',
          }}
        />
      </div>
      
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20"
          >
            <Zap className="w-4 h-4" />
            Start creating today
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Stop guessing.
            <br />
            <span className="text-white/80">Start growing.</span>
          </h2>

          {/* Subtext */}
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Chasing viral moments or building momentum — we've got the data to back every move.
          </p>

          {/* CTA button */}
          <div className="flex justify-center">
            <Button className="bg-white text-gray-900 hover:bg-white/90 px-8 py-6 text-lg rounded-lg font-semibold shadow-2xl shadow-black/20">
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Trust indicators */}
          <p className="text-white/50 text-sm mt-8">
            No credit card required • Free plan forever • Upgrade anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};
