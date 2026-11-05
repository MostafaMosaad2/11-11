import { useCallback, useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import { armAmbient } from "./audio/engine";
import AudioController from "./components/AudioController";
import CinematicTransition from "./components/CinematicTransition";
import ExperienceProgress from "./components/ExperienceProgress";
import GalaxyBackground from "./components/GalaxyBackground";
import GiftReveal from "./components/GiftReveal";
import HiddenLoveLetter from "./components/HiddenLoveLetter";
import SurpriseVideoMemory from "./components/SurpriseVideoMemory";
import MemoryChapter from "./components/MemoryChapter";
import MemoryGalaxy from "./components/MemoryGalaxy";
import OpeningScene from "./components/OpeningScene";
import SecretEnding from "./components/SecretEnding";
import StarConstellation from "./components/StarConstellation";
import WishScene from "./components/WishScene";
import { story } from "./data/story";
import { useExperience } from "./hooks/useExperience";
import { keys, readStorage, readVolume } from "./utils/storage";
import { canUseWebGL } from "./utils/quality";

export default function App() {
  const {
    scene,
    memoryId,
    visited,
    stars,
    setStars,
    starsComplete,
    wish,
    saveWish,
    deleteWish,
    wash,
    travel,
    restart,
    reduced,
  } = useExperience();
  const stageRef = useRef(null);
  const firstFocus = useRef(true);
  const memory = story.memories.find((item) => item.id === memoryId) ?? story.memories[0];
  const mood = scene === "memory" ? memory.mood : scene;
  const endingSeen = visited.includes("ending");

  useEffect(() => {
    const stage = stageRef.current;
    stage?.scrollTo(0, 0);
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    stage?.querySelector("h1, h2")?.focus({ preventScroll: true });
  }, [scene, memoryId]);

  useEffect(() => {
    if (scene !== "wish" || reduced || !canUseWebGL()) return;
    if (story.gift.image && !story.gift.jewelry.modelUrl) return;
    import("./components/gift/JewelryCanvas");
  }, [reduced, scene]);

  const engage = useCallback(() => {
    armAmbient(readStorage(keys.muted, false) === true, readVolume());
  }, []);

  const toGalaxy = useCallback(() => {
    travel({ scene: "galaxy" }, { wash: "soft", hold: 420 });
  }, [travel]);

  function enterStory({ immediate = false } = {}) {
    travel({ scene: "memory", memoryId: "memory-1" }, { immediate, wash: "gold", hold: 760 });
  }

  function nextFromMemory() {
    const order = story.memories.map((item) => item.id);
    const index = order.indexOf(memoryId);
    if (index < order.length - 1) {
      travel(
        { scene: "memory", memoryId: order[index + 1] },
        { wash: memory.mood === "dim" ? "dark" : "soft", hold: 520 },
      );
      return;
    }
    travel({ scene: "letter" }, { wash: "candle", hold: 640 });
  }

  function discoverStar(index) {
    setStars((current) => {
      if (current[index]) return current;
      const next = current.slice();
      next[index] = true;
      return next;
    });
  }

  let content = null;
  if (scene === "opening") {
    content = <OpeningScene onStart={enterStory} onEngage={engage} reduced={reduced} />;
  } else if (scene === "galaxy") {
    content = (
      <MemoryGalaxy visited={visited} starsComplete={starsComplete} reduced={reduced} onOpen={(target) => travel(target, { wash: "soft", hold: 460 })} />
    );
  } else if (scene === "memory") {
    content = <MemoryChapter memory={memory} onNext={nextFromMemory} />;
  } else if (scene === "letter") {
    content = (
      <HiddenLoveLetter onNext={() => travel({ scene: "video" }, { wash: "candle", hold: 640 })} />
    );
  } else if (scene === "video") {
    content = (
      <SurpriseVideoMemory
        reduced={reduced}
        onNext={() => travel({ scene: "stars" }, { wash: "soft", hold: 520 })}
      />
    );
  } else if (scene === "stars") {
    content = (
      <StarConstellation
        found={stars}
        onFound={discoverStar}
        onContinue={() => travel({ scene: "wish" }, { wash: "soft", hold: 520 })}
        reduced={reduced}
      />
    );
  } else if (scene === "wish") {
    content = (
      <WishScene
        wish={wish}
        onSave={saveWish}
        onDelete={deleteWish}
        onNext={() => travel({ scene: "gift" }, { wash: "gold", hold: 680 })}
        reduced={reduced}
      />
    );
  } else if (scene === "gift") {
    content = (
      <GiftReveal
        endingSeen={endingSeen}
        onSurprise={() => travel({ scene: "ending" }, { wash: "dark", hold: reduced ? 0 : 1000, immediate: reduced })}
      />
    );
  } else {
    content = <SecretEnding visited={visited} onRestart={restart} onGalaxy={toGalaxy} reduced={reduced} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <GalaxyBackground mood={mood} />
      <a className="skip-link" href="#stage-root">
        {story.ui.skipLink}
      </a>
      <AudioController />
      {scene === "opening" ? null : (
        <ExperienceProgress scene={scene} memoryId={memoryId} visited={visited} />
      )}
      <main
        id="stage-root"
        ref={stageRef}
        tabIndex={-1}
        className={`stage-wrap${scene === "galaxy" ? " is-locked" : ""}`}
        data-mood={mood}
      >
        {content}
      </main>
      <CinematicTransition wash={wash} />
    </MotionConfig>
  );
}
