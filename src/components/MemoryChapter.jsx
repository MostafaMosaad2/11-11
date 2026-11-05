import CalendarScene from "./CalendarScene";
import Chapter from "./Chapter";
import ChatReenactment from "./ChatReenactment";
import HeartFromStars from "./HeartFromStars";
import StarsReturn from "./StarsReturn";
import { story } from "../data/story";

const visuals = {
  "memory-1": <CalendarScene year={2024} month={8} day={10} />,
  "memory-2": <HeartFromStars />,
  "memory-3": <StarsReturn />,
};

export default function MemoryChapter({ memory, onNext }) {
  if (!memory) return null;

  return (
    <Chapter
      id={memory.id}
      kicker={memory.kicker}
      title={memory.title}
      date={memory.date}
      dateTime={memory.dateTime}
      tone={memory.tone}
      visual={visuals[memory.id] ?? null}
      text={memory.text}
    >
      {memory.chat ? <ChatReenactment /> : null}
      <div className="chapter-nav">
        <button type="button" className="btn btn-solid" onClick={onNext}>
          {story.ui.next}
        </button>
      </div>
    </Chapter>
  );
}
