import { useCallback, useEffect, useRef, useState } from "react";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import {
  keys,
  readSession,
  readStars,
  readWish,
  removeStorage,
  writeSession,
  writeStorage,
} from "../utils/storage";

const SCENES = new Set(["opening", "galaxy", "memory", "letter", "video", "stars", "wish", "gift", "ending"]);

function readScene() {
  const value = readSession(keys.scene, "opening");
  return typeof value === "string" && SCENES.has(value) ? value : "opening";
}

function readMemory() {
  const value = readSession(keys.memory, "memory-1");
  return story.memories.some((item) => item.id === value) ? value : "memory-1";
}

function readVisited() {
  const value = readSession(keys.visited, []);
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function useExperience() {
  const reduced = usePrefersReducedMotion();
  const [scene, setScene] = useState(readScene);
  const [memoryId, setMemoryId] = useState(readMemory);
  const [visited, setVisited] = useState(readVisited);
  const [fromGalaxy, setFromGalaxy] = useState(() => readSession(keys.fromGalaxy, false) === true);
  const [stars, setStars] = useState(readStars);
  const [wish, setWish] = useState(readWish);
  const [wash, setWash] = useState(null);
  const timer = useRef(0);

  useEffect(() => {
    const done = stars.every(Boolean);
    if (!done && (scene === "wish" || scene === "gift" || scene === "ending")) setScene("stars");
    // The saved scene is checked once, against the stars already stored on this device.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writeSession(keys.scene, scene);
  }, [scene]);

  useEffect(() => {
    writeSession(keys.memory, memoryId);
  }, [memoryId]);

  useEffect(() => {
    writeSession(keys.visited, visited);
  }, [visited]);

  useEffect(() => {
    writeSession(keys.fromGalaxy, fromGalaxy);
  }, [fromGalaxy]);

  useEffect(() => {
    writeStorage(keys.stars, stars);
  }, [stars]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const apply = useCallback((next, openedFromGalaxy = false) => {
    setFromGalaxy(openedFromGalaxy === true);
    if (next.memoryId) setMemoryId(next.memoryId);
    setScene(next.scene);
    const markId = next.scene === "memory" ? next.memoryId : next.scene;
    if (!markId || markId === "opening" || markId === "galaxy") return;
    setVisited((current) => (current.includes(markId) ? current : [...current, markId]));
  }, []);

  const travel = useCallback(
    (next, options = {}) => {
      const openedFromGalaxy = options.fromGalaxy === true;
      window.clearTimeout(timer.current);
      if (reduced || options.immediate) {
        setWash(null);
        apply(next, openedFromGalaxy);
        return;
      }
      setWash(options.wash || "gold");
      timer.current = window.setTimeout(() => {
        apply(next, openedFromGalaxy);
        timer.current = window.setTimeout(() => setWash(null), 70);
      }, options.hold ?? 700);
    },
    [apply, reduced],
  );

  const restart = useCallback(() => {
    window.clearTimeout(timer.current);
    setWash(null);
    setVisited([]);
    setFromGalaxy(false);
    setMemoryId("memory-1");
    setScene("opening");
  }, []);

  const saveWish = useCallback((text) => {
    setWish(text);
    return writeStorage(keys.wish, text);
  }, []);

  const deleteWish = useCallback(() => {
    setWish(null);
    return removeStorage(keys.wish);
  }, []);

  return {
    scene,
    memoryId,
    visited,
    fromGalaxy,
    stars,
    setStars,
    starsComplete: stars.every(Boolean),
    wish,
    saveWish,
    deleteWish,
    wash,
    travel,
    restart,
    reduced,
  };
}
