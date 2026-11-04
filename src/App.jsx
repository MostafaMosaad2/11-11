import { useCallback, useState } from "react";
import { MotionConfig } from "framer-motion";
import GalaxyBackground from "./components/GalaxyBackground";
import GiftReveal from "./components/GiftReveal";
import OpeningScene from "./components/OpeningScene";
import StarConstellation from "./components/StarConstellation";
import StoryChapters from "./components/StoryChapters";
import WishScene from "./components/WishScene";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { scrollToId } from "./utils/scroll";

export default function App() {
  const reduced = usePrefersReducedMotion();
  const [unlocked, setUnlocked] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const unlock = useCallback(() => setUnlocked(true), []);

  function startStory() {
    scrollToId("chapter-1", reduced);
    document.getElementById("chapter-1-title")?.focus({ preventScroll: true });
  }

  function restart() {
    setGiftOpen(false);
    scrollToId("opening", reduced);
    document.getElementById("opening")?.focus({ preventScroll: true });
  }

  return (
    <MotionConfig reducedMotion="user">
      <GalaxyBackground />
      <a className="skip-link" href="#chapter-1">
        تخطي إلى الحكاية
      </a>
      <main>
        <OpeningScene onStart={startStory} />
        <StoryChapters />
        <StarConstellation onUnlock={unlock} reduced={reduced} />
        {unlocked ? (
          <>
            <WishScene />
            <GiftReveal open={giftOpen} onOpen={() => setGiftOpen(true)} onRestart={restart} />
          </>
        ) : null}
      </main>
    </MotionConfig>
  );
}
