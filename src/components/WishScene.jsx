import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const DUST = [
  { left: "8%", delay: "0s", duration: "7s" },
  { left: "16%", delay: "1.2s", duration: "8s" },
  { left: "28%", delay: "0.4s", duration: "6.5s" },
  { left: "41%", delay: "2s", duration: "9s" },
  { left: "55%", delay: "0.8s", duration: "7.4s" },
  { left: "67%", delay: "1.6s", duration: "8.2s" },
  { left: "78%", delay: "0.2s", duration: "6.8s" },
  { left: "90%", delay: "2.4s", duration: "9.2s" },
  { left: "34%", delay: "3s", duration: "7.8s" },
  { left: "62%", delay: "1s", duration: "8.6s" },
];

function Digit({ final, delay, reduced }) {
  const [value, setValue] = useState(reduced ? final : 3);

  useEffect(() => {
    if (reduced) return undefined;
    const toTwo = window.setTimeout(() => setValue(2), delay);
    const toFinal = window.setTimeout(() => setValue(final), delay + 340);
    return () => {
      window.clearTimeout(toTwo);
      window.clearTimeout(toFinal);
    };
  }, [delay, final, reduced]);

  return (
    <span className="digit" aria-hidden="true">
      <span key={value} className="digit-face">
        {value}
      </span>
    </span>
  );
}

export default function WishScene() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="scene wish" id="wish" aria-labelledby="wish-title">
      {!reduced ? (
        <div className="dust" aria-hidden="true">
          {DUST.map((speck) => (
            <span
              key={`${speck.left}-${speck.delay}`}
              style={{ left: speck.left, animationDelay: speck.delay, animationDuration: speck.duration }}
            />
          ))}
        </div>
      ) : null}
      <motion.div
        className="chapter-inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">{story.wish.kicker}</p>
        <h2 id="wish-title" tabIndex={-1} className="sr-only">
          {story.wish.title}
        </h2>
        <div className="flip-clock" dir="ltr" role="img" aria-label={story.wish.clockLabel}>
          <Digit final={1} delay={80} reduced={reduced} />
          <Digit final={1} delay={220} reduced={reduced} />
          <span className="colon" aria-hidden="true">
            :
          </span>
          <Digit final={1} delay={360} reduced={reduced} />
          <Digit final={1} delay={500} reduced={reduced} />
        </div>
        <p className="prose wish-text">{story.wish.text}</p>
      </motion.div>
    </section>
  );
}
