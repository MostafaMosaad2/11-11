import { motion } from "framer-motion";

export default function Chapter({ id, kicker, title, date, dateTime, tone = "default", visual, text, children }) {
  return (
    <section id={id} className={`scene chapter tone-${tone}`} aria-labelledby={`${id}-title`}>
      <motion.div
        className="chapter-inner"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">{kicker}</p>
        <h2 id={`${id}-title`} tabIndex={-1}>
          {title}
        </h2>
        {date ? (
          <p className="chapter-date">
            <time dateTime={dateTime}>{date}</time>
          </p>
        ) : null}
        {visual ? <div className="chapter-visual">{visual}</div> : null}
        {text ? <p className="prose">{text}</p> : null}
        {children}
      </motion.div>
    </section>
  );
}
