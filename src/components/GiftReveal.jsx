import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { canUseWebGL, visualQuality } from "../utils/quality";
import Necklace from "./Necklace";
import VoiceMessage from "./VoiceMessage";
import WebGLBoundary from "./gift/WebGLBoundary";

const JewelryCanvas = lazy(() => import("./gift/JewelryCanvas"));

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

function CssGiftBox({ open, reduced, showImage, onImageError }) {
  return (
    <div className={`box-scene${open ? " is-open" : ""}`}>
      <div className="necklace-slot">
        {showImage ? (
          <img
            className="necklace-photo"
            src={story.gift.image}
            alt={open ? story.gift.imageAlt : ""}
            aria-hidden={open ? undefined : true}
            onError={onImageError}
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
        <div className="box-body" />
      </div>
    </div>
  );
}

export default function GiftReveal({ endingSeen, onSurprise, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sent = useRef(false);
  const surpriseRef = useRef(onSurprise);

  useEffect(() => {
    surpriseRef.current = onSurprise;
  }, [onSurprise]);

  const photo = Boolean(story.gift.image) && !imageFailed;
  const model = Boolean(story.gift.jewelry.modelUrl?.trim());
  const allow3d = !reduced && canUseWebGL() && (model || !photo) && !failed;
  const quality = visualQuality();
  const showImage = photo;

  useEffect(() => {
    if (!open || reduced || endingSeen) return undefined;
    const timer = window.setTimeout(() => {
      if (sent.current) return;
      sent.current = true;
      surpriseRef.current();
    }, 16000);
    return () => window.clearTimeout(timer);
  }, [endingSeen, open, reduced]);

  function surprise() {
    if (sent.current) return;
    sent.current = true;
    onSurprise();
  }

  return (
    <section className="scene gift" id="gift" aria-labelledby="gift-title">
      <motion.div
        className="gift-inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">{story.gift.kicker}</p>
        <h2 id="gift-title" tabIndex={-1}>
          {story.gift.title}
        </h2>
        {open ? null : (
          <>
            <p className="gift-lead">{story.gift.lead}</p>
            <p className="gift-sub">{story.gift.sub}</p>
          </>
        )}

        <div className={`gift-visual${ready && allow3d ? " is-3d" : ""}`}>
          <div className="gift-css">
            <CssGiftBox
              open={open}
              reduced={reduced}
              showImage={showImage}
              imageFailed={imageFailed}
              onImageError={() => setImageFailed(true)}
            />
          </div>
          {allow3d ? (
            <div className="gift-canvas">
              <WebGLBoundary fallback={null} onFail={() => setFailed(true)}>
                <Suspense fallback={null}>
                  <JewelryCanvas
                    open={open}
                    quality={quality}
                    metal={story.gift.jewelry.metal}
                    velvet={story.gift.jewelry.velvet}
                    modelUrl={model ? story.gift.jewelry.modelUrl.trim() : ""}
                    modelScale={story.gift.jewelry.modelScale || 1}
                    modelY={story.gift.jewelry.modelY || 0}
                    onReady={() => setReady(true)}
                  />
                </Suspense>
              </WebGLBoundary>
            </div>
          ) : null}
        </div>

        {open ? <p className="sr-only">{story.gift.imageAlt}</p> : null}
        {open && ready && allow3d ? <p className="gift-hint">{story.gift.dragHint}</p> : null}

        {!open ? (
          <div className="chapter-nav">
            <button type="button" className="btn btn-solid" onClick={() => setOpen(true)}>
              {story.gift.open}
            </button>
            {onGalaxy ? (
              <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                {story.ui.toGalaxy}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="gift-copy">
            <p className="prose">{story.gift.text}</p>
            <VoiceMessage />
            <div className="chapter-nav">
              {endingSeen ? (
                <button type="button" className="btn btn-ghost" onClick={onSurprise}>
                  {story.ending.more}
                </button>
              ) : (
                <button type="button" className="btn-text" onClick={surprise}>
                  {reduced ? story.ending.more : story.ui.skip}
                </button>
              )}
              {onGalaxy ? (
                <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                  {story.ui.toGalaxy}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
