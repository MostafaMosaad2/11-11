import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { story } from "../data/story";
import DateMark from "./DateMark";

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

export default function WishScene({ wish, onSave, onDelete, onNext, reduced }) {
  const privacyId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(wish || "");
  const [editing, setEditing] = useState(!wish);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const [showWish, setShowWish] = useState(false);
  const [flying, setFlying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!flying) return undefined;
    const timer = window.setTimeout(() => setFlying(false), 1700);
    return () => window.clearTimeout(timer);
  }, [flying]);

  function submit(event) {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError(story.wish.empty);
      return;
    }
    setError("");
    setConfirming(false);
    const saved = onSave(next);
    setWarning(!saved);
    setEditing(false);
    setShowWish(true);
    if (!reduced) setFlying(true);
  }

  function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete();
    setDraft("");
    setEditing(true);
    setShowWish(false);
    setConfirming(false);
    setWarning(false);
    setError("");
  }

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
        className="chapter-inner wish-sky"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {flying ? <span className="wish-comet" aria-hidden="true" /> : null}
        {flying ? <span className="wish-ripple" aria-hidden="true" /> : null}
        <p className="eyebrow">{story.wish.kicker}</p>
        <h2 id="wish-title" tabIndex={-1}>
          {story.wish.title}
        </h2>
        <DateMark reduced={reduced} size="wish" />
        <p className="prose is-center wish-text">{story.wish.text}</p>
        <p className="wish-aside">{story.wish.aside}</p>
        <p className="wish-turn">{story.wish.turn}</p>

        {wish && !editing ? (
          <div className="wish-saved">
            <p className="wish-success" role="status">
              {story.wish.saved}
            </p>
            {showWish ? <p className="wish-card">{wish}</p> : null}
            {warning ? <p className="wish-error">{story.wish.persistFail}</p> : null}
            <div className="wish-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowWish((value) => !value)}>
                {showWish ? story.wish.hide : story.wish.view}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDraft(wish);
                  setEditing(true);
                  setConfirming(false);
                }}
              >
                {story.wish.edit}
              </button>
              <button type="button" className="btn btn-ghost" onClick={remove}>
                {confirming ? story.wish.confirmRemove : story.wish.remove}
              </button>
            </div>
          </div>
        ) : (
          <form className="wish-form" onSubmit={submit} noValidate>
            <label className="sr-only" htmlFor="wish-input">
              {story.wish.placeholder}
            </label>
            <textarea
              id="wish-input"
              className="wish-input"
              dir="rtl"
              rows={4}
              maxLength={400}
              placeholder={story.wish.placeholder}
              value={draft}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${privacyId} ${errorId}` : privacyId}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError("");
              }}
            />
            {error ? (
              <p className="wish-error" id={errorId} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn-solid" disabled={flying}>
              {story.wish.send}
            </button>
            {wish ? (
              <button type="button" className="btn-text" onClick={() => setEditing(false)}>
                {story.wish.cancel}
              </button>
            ) : null}
          </form>
        )}
        <p className="wish-privacy" id={privacyId}>
          {story.wish.privacy}
        </p>
        <div className="chapter-nav">
          <button type="button" className="btn btn-ghost" onClick={onNext}>
            {story.ui.next}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
