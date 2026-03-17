import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AgentStepsDisplay({ steps = [], isLive = false }) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1.5 max-w-full">
      <AnimatePresence initial={false}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="flex items-start gap-2"
          >
            {isLive && idx === steps.length - 1 ? (
              <Loader2 className="w-3 h-3 text-teal-500 animate-spin mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-xs text-slate-600 leading-relaxed">{step}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}