import { story } from "../data/story";

const steps = [...story.memories.map((item) => item.id), "letter", "stars", "wish", "gift"];

function dotState(id, current, visited) {
  if (id === current) return "is-current";
  if (visited.includes(id)) return "is-done";
  return "";
}

export default function ExperienceProgress({ scene, memoryId, visited, onGalaxy }) {
  if (scene === "ending") return null;
  const current = scene === "memory" ? memoryId : scene;

  return (
    <>
      {scene !== "galaxy" ? (
        <button type="button" className="btn btn-ghost btn-tiny nav-galaxy" onClick={onGalaxy}>
          {story.ui.toGalaxyShort}
        </button>
      ) : null}
      <div className="progress-dots" aria-hidden="true">
        {steps.map((id) => (
          <i key={id} className={dotState(id, current, visited)} />
        ))}
      </div>
    </>
  );
}
