import { motion } from "framer-motion";

export default function ContentInsightBanner({ insight }: { insight: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-white/[0.06] px-5 py-4 flex items-start gap-3"
      style={{ background: "#1C1C1E" }}
    >
      <span className="text-base mt-0.5 shrink-0">&#x1F4A1;</span>
      <p className="text-sm text-white/55 leading-relaxed">
        &ldquo;{insight}&rdquo;
      </p>
    </motion.div>
  );
}
