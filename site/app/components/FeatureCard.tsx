"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  commands: string[];
}

export function FeatureCard({
  icon,
  title,
  description,
  commands,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5 }}
      className="group rounded-xl border border-tidal-gray-700 bg-tidal-gray-900 p-6 hover:border-tidal-cyan/30 transition-colors duration-300"
    >
      <div className="text-tidal-cyan text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-tidal-gray-400 text-sm leading-relaxed mb-4">
        {description}
      </p>
      <div className="space-y-1.5">
        {commands.map((cmd, i) => (
          <div
            key={i}
            className="font-mono text-xs text-tidal-gray-300 bg-tidal-gray-800 rounded px-3 py-1.5"
          >
            <span className="text-tidal-cyan/60 select-none">$ </span>
            {cmd}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
