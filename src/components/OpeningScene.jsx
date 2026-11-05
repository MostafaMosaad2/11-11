import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
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

  function skip() {
    if (leaving.current && reduced) return;
    leaving.current = true;
    window.clearTimeout(timer.current);
    onEngage?.();
    onStart?.({ immediate: true });
  }

  return (
    <section className="scene opening" id="opening" aria-labelledby="opening-title">
      <Starfield rush={rush} reduced={reduced} />
      <div className="eclipse" aria-hidden="true" />
      <div className={`opening-inner${rush ? " is-leaving" : ""}`}>
        <motion.p className="eyebrow numeral" dir="ltr" initial="hidden" animate="show" variants={fade} custom={0.15}>
          11 / 11
        </motion.p>
        <motion.h1
          id="opening-title"
          className="clock-hero"
          dir="ltr"
          tabIndex={-1}
          initial="hidden"
          animate="show"
          variants={fade}
          custom={0.3}
          aria-label={story.opening.clockLabel}
        >
          11:11
        </motion.h1>
        <motion.p className="opening-message" initial="hidden" animate="show" variants={fade} custom={0.55}>
          {story.opening.message}
        </motion.p>
        <motion.div className="opening-actions" initial="hidden" animate="show" variants={fade} custom={0.8}>
          <button type="button" className="btn btn-solid" onClick={begin} disabled={rush}>
            {story.opening.cta}
          </button>
        </motion.div>
      </div>
      <button type="button" className="btn-text opening-skip" onClick={skip}>
        {story.ui.skipIntro}
      </button>
    </section>
  );
}
