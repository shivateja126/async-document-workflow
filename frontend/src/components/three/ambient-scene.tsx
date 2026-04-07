"use client";

import { motion } from "framer-motion";

const blobs = [
  {
    className:
      "left-[6%] top-[10%] h-72 w-72 bg-[radial-gradient(circle_at_40%_40%,rgba(93,135,255,0.34),rgba(93,135,255,0.12)_52%,transparent_72%)]",
    duration: 12
  },
  {
    className:
      "right-[4%] top-[14%] h-[28rem] w-[28rem] bg-[radial-gradient(circle_at_50%_50%,rgba(57,209,201,0.20),rgba(57,209,201,0.08)_48%,transparent_72%)]",
    duration: 14
  }
];

export function AmbientScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,7,20,0.12),rgba(1,7,20,0.38))]" />
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={{
            x: [0, index === 0 ? 18 : -18, 0],
            y: [0, index === 0 ? -10 : 12, 0],
            scale: [1, 1.04, 1]
          }}
          transition={{
            duration: blob.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
