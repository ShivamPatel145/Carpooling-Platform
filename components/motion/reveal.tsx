"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { motion as motionTokens } from "@/lib/design-tokens";

/**
 * ONE orchestrated load reveal (design-standards §6): a container that staggers its children in.
 * Respects prefers-reduced-motion — when set, children appear immediately with no transform.
 * Durations/easings come from the motion tokens. Use sparingly; excess animation is an AI tell.
 */
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: motionTokens.stagger, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.ease.out as [number, number, number, number],
    },
  },
};

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
