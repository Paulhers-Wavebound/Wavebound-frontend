import React from "react";
import { motion } from "framer-motion";

/**
 * Morphing blob loading animation — shown while the AI is thinking.
 * Dark-theme adaptation: uses a subtle gradient blob on transparent bg.
 * Sized to sit inline within the chat flow without dominating.
 */

const BLOB_SIZE = 24;

const BlobLoader = React.memo(function BlobLoader({
  label,
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 py-3"
    >
      <div
        className="shrink-0"
        style={{
          width: BLOB_SIZE,
          height: BLOB_SIZE,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 100%)",
          animation: "blobMorph 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: "13px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      )}

      {/* Keyframes injected once — safe to duplicate, browser dedupes */}
      <style>{`
        @keyframes blobMorph {
          0%    { border-radius: 42% 58% 55% 45% / 48% 52% 50% 50%; }
          12%   { border-radius: 65% 35% 40% 60% / 30% 70% 55% 45%; }
          24%   { border-radius: 35% 65% 70% 30% / 60% 40% 35% 65%; }
          36%   { border-radius: 55% 45% 30% 70% / 45% 55% 65% 35%; }
          48%   { border-radius: 28% 72% 50% 50% / 50% 50% 40% 60%; }
          60%   { border-radius: 70% 30% 45% 55% / 35% 65% 50% 50%; }
          72%   { border-radius: 40% 60% 65% 35% / 55% 45% 30% 70%; }
          84%   { border-radius: 50% 50% 35% 65% / 45% 55% 60% 40%; }
          100%  { border-radius: 42% 58% 55% 45% / 48% 52% 50% 50%; }
        }
      `}</style>
    </motion.div>
  );
});

export default BlobLoader;
