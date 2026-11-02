import type { Transition, Variants } from "motion/react";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 32,
  mass: 0.7,
};

export const springDrawer: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 34,
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};
