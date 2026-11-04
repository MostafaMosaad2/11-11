import { motion } from "framer-motion";
import Petals from "./Petals";
import { story } from "../data/story";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function OpeningScene({ onStart }) {
  return (
    <section className="scene opening" id="opening" tabIndex={-1} aria-labelledby="opening-title">
      <Petals />
      <div className="eclipse" aria-hidden="true" />
      <div className="opening-stars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="opening-inner">
        <motion.p className="eyebrow numeral" dir="ltr" initial="hidden" animate="show" variants={fade} custom={0.15}>
          11 / 11
        </motion.p>
        <motion.h1
          id="opening-title"
          className="clock-hero"
          dir="ltr"
          initial="hidden"
          animate="show"
          variants={fade}
          custom={0.3}
          aria-label={story.opening.clockLabel}
        >
          11:11
        </motion.h1>
        <motion.p
          className="opening-message"
          initial="hidden"
          animate="show"
          variants={fade}
          custom={0.55}
        >
          {story.opening.message}
        </motion.p>
        <motion.div initial="hidden" animate="show" variants={fade} custom={0.8}>
          <button type="button" className="btn btn-gold" onClick={onStart}>
            {story.opening.cta}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
