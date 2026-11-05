import { motion } from "framer-motion";
import { story } from "../data/story";

const ease = [0.22, 1, 0.36, 1];

export default function DateMark({ reduced = false, size = "hero" }) {
  const pace = size === "hero" ? 1 : 0.6;
  const wait = (seconds) => (reduced ? 0 : seconds * pace);
  const enter = (seconds, extra = {}) =>
    reduced
      ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.01 } }
      : {
          initial: { opacity: 0, y: extra.y ?? 16, scale: extra.scale ?? 1 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: extra.duration ?? 0.85, delay: wait(seconds), ease },
        };

  return (
    <div className={`date-mark date-mark-${size}`} dir="ltr" role="img" aria-label={`${story.opening.dateLabel}/${story.opening.year}`}>
      <motion.span className="date-num" {...enter(0.35)}>
        11
      </motion.span>
      <motion.span className="date-slash" {...enter(1.05, { y: 0, scale: 0.72, duration: 0.7 })}>
        /
      </motion.span>
      <motion.span className="date-num" {...enter(0.62)}>
        11
      </motion.span>
      <motion.span className="date-year" {...enter(1.5, { y: 8, duration: 0.7 })}>
        {story.opening.year}
      </motion.span>
    </div>
  );
}
