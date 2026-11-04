import { useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import Necklace from "./Necklace";
import Petals from "./Petals";
import VoiceMessage from "./VoiceMessage";

const SPARK_SPOTS = [
  { top: "8%", left: "18%" },
  { top: "20%", left: "78%" },
  { top: "42%", left: "8%" },
  { top: "36%", left: "88%" },
  { top: "64%", left: "16%" },
  { top: "70%", left: "80%" },
  { top: "86%", left: "40%" },
  { top: "14%", left: "48%" },
];

export default function GiftReveal({ open, onOpen, onRestart }) {
  const reduced = usePrefersReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(story.gift.image) && !imageFailed;

  return (
    <section className="scene gift" id="gift" aria-labelledby="gift-title">
      <Petals />
      <motion.div
        className="gift-inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">{story.gift.kicker}</p>
        <h2 id="gift-title" tabIndex={-1}>
          {story.gift.title}
        </h2>

        <div className={`box-scene${open ? " is-open" : ""}`}>
          <div className="necklace-slot">
            {showImage ? (
              <img
                className="necklace-photo"
                src={story.gift.image}
                alt={open ? story.gift.imageAlt : ""}
                aria-hidden={open ? undefined : true}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Necklace />
            )}
            {open && !reduced ? (
              <div className="sparkles" aria-hidden="true">
                {SPARK_SPOTS.map((spot) => (
                  <span key={`${spot.top}-${spot.left}`} style={spot} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="box" aria-hidden="true">
            <div className="box-lid">
              <div className="lid-face">
                <span>✦</span>
              </div>
            </div>
            <div className="box-body">
              <div className="box-cushion" />
              <div className="box-light" />
            </div>
          </div>
        </div>

        {open ? <p className="sr-only">{story.gift.imageAlt}</p> : null}

        {!open ? (
          <button type="button" className="btn btn-solid" onClick={onOpen}>
            {story.gift.open}
          </button>
        ) : (
          <div className="gift-copy">
            <p className="prose">{story.gift.text}</p>
            <VoiceMessage />
            <button type="button" className="btn btn-gold" onClick={onRestart}>
              {story.gift.restart}
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
