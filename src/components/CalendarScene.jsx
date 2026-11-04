const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const WEEKDAYS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

function buildMonth(year, month, day) {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() + 1) % 7;
  const days = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: offset }, () => null);
  for (let date = 1; date <= days; date += 1) cells.push(date);
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells, marked: day };
}

export default function CalendarScene({ year = 2024, month = 8, day = 10 }) {
  const { cells, marked } = buildMonth(year, month, day);

  return (
    <div className="calendar" aria-hidden="true">
      <div className="calendar-glow" />
      <div className="calendar-card">
        <p className="calendar-month">{MONTHS[month - 1]}</p>
        <p className="calendar-year">{year}</p>
        <div className="calendar-week">
          {WEEKDAYS.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((value, index) => (
            <span
              key={`${value ?? "e"}-${index}`}
              className={value === marked ? "day is-marked" : value ? "day" : "day is-empty"}
              style={{ animationDelay: `${index * 18}ms` }}
            >
              {value ?? ""}
              {value === marked && <i className="day-star" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
