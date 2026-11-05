import { story } from "../data/story";

const steps = [...story.memories.map((item) => item.id), "letter", "video", "stars", "wish", "gift"];

function dotState(id, current, visited) {
  if (id === current) return "is-current";
  if (visited.includes(id)) return "is-done";
  return "";
}

export default function ExperienceProgress({ scene, memoryId, visited }) {
  if (scene === "ending") return null;
  const current = scene === "memory" ? memoryId : scene;

  return (
    <div className="progress-dots" aria-hidden="true">
      {steps.map((id) => (
        <i key={id} className={dotState(id, current, visited)} />
      ))}
    </div>
  );
}
