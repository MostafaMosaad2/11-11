const FIELD = [
  [12, 22],
  [28, 14],
  [46, 20],
  [68, 12],
  [84, 24],
  [18, 42],
  [38, 36],
  [58, 44],
  [76, 38],
  [90, 48],
  [10, 64],
  [30, 70],
  [50, 60],
  [70, 72],
  [86, 66],
  [22, 86],
  [44, 82],
  [64, 88],
  [80, 84],
];

export default function StarsReturn() {
  return (
    <div className="return-sky" aria-hidden="true">
      <div className="return-layer return-layer-a">
        {FIELD.map(([left, top]) => (
          <span key={`a-${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }} />
        ))}
      </div>
      <div className="return-layer return-layer-b">
        {FIELD.map(([left, top]) => (
          <span key={`b-${left}-${top}`} style={{ left: `${left + 4}%`, top: `${top - 6}%` }} />
        ))}
      </div>
    </div>
  );
}
