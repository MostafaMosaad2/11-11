import CalendarScene from "./CalendarScene";
import Chapter from "./Chapter";
import ChatReenactment from "./ChatReenactment";
import HeartFromStars from "./HeartFromStars";
import StarsReturn from "./StarsReturn";
import { story } from "../data/story";

const visuals = {
  "chapter-1": <CalendarScene year={2024} month={8} day={10} />,
  "chapter-2": <HeartFromStars />,
  "chapter-3": <StarsReturn />,
  "chapter-5": <HeartFromStars steady caption="1 أغسطس 2026" />,
};

export default function StoryChapters() {
  return (
    <>
      {story.chapters.map((chapter) => (
        <Chapter
          key={chapter.id}
          id={chapter.id}
          kicker={chapter.kicker}
          title={chapter.title}
          date={chapter.date}
          dateTime={chapter.dateTime}
          tone={chapter.tone}
          visual={visuals[chapter.id] ?? null}
          text={chapter.text}
        >
          {chapter.id === "chapter-4" ? <ChatReenactment /> : null}
        </Chapter>
      ))}
    </>
  );
}
