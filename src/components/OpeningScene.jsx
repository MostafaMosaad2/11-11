import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
import DateMark from "./DateMark";
import Starfield from "./Starfield";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function OpeningScene({ onStart, onEngage, reduced }) {
  const [rush, setRush] = useState(false);
  const timer = useRef(0);
  const leaving = useRef(false);
  const copy = story.opening;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function begin() {
    if (leaving.current) return;
    leaving.current = true;
    onEngage?.();
    if (reduced) {
      onStart?.({ immediate: true });
      return;
    }
    setRush(true);
    timer.current = window.setTimeout(() => onStart?.({ immediate: false }), 1250);
  }

  return (
    <section className="scene opening" id="opening" aria-labelledby="opening-title">
      <Starfield rush={rush} reduced={reduced} />
      <div className="eclipse" aria-hidden="true" />
      <div className={`opening-inner${rush ? " is-leaving" : ""}`}>
        <DateMark reduced={reduced} size="hero" />
        <motion.p
          className="opening-subtitle"
          initial="hidden"
          animate="show"
          variants={fade}
          custom={reduced ? 0 : 1.85}
        >
          {copy.subtitle}
        </motion.p>
        <motion.p className="opening-fulldate" initial="hidden" animate="show" variants={fade} custom={reduced ? 0 : 2.05}>
          {copy.fullDate}
        </motion.p>
        <motion.h1 id="opening-title" className="sr-only" tabIndex={-1}>
          {copy.dateLabel}
        </motion.h1>
        <motion.p className="opening-message" initial="hidden" animate="show" variants={fade} custom={reduced ? 0 : 2.35}>
          {copy.message}
        </motion.p>
        <motion.div className="opening-actions" initial="hidden" animate="show" variants={fade} custom={reduced ? 0 : 2.9}>
          <button type="button" className="btn btn-solid" onClick={begin} disabled={rush}>
            {copy.cta}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
