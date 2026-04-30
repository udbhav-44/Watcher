"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export const PageTransition = ({ children }: Props): JSX.Element => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={false}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
