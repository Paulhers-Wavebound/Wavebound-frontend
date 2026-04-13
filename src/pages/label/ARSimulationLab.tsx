/**
 * A&R Simulation Lab Page
 *
 * Route: /label/ar/simulation
 */
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import SimulationLab from "@/components/label/ar/SimulationLab";

export default function ARSimulationLabPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 lg:p-10">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/60 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to A&R Pipeline
      </motion.button>

      <SimulationLab />
    </div>
  );
}
