import { AnimatePresence, motion } from "framer-motion";

export default function CinematicTransition({ wash }) {
  return (
    <AnimatePresence>
      {wash ? (
        <motion.div
          key={wash}
          className={`wash wash-${wash}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );
}
