import { useId, type ReactNode } from "react";

export function LessonLayout({
  title,
  description,
  visual,
  children,
  className = "",
  headingLevel = 2,
}: {
  title: string;
  description?: ReactNode;
  visual?: ReactNode;
  children?: ReactNode;
  className?: string;
  headingLevel?: 1 | 2;
}) {
  const id = useId();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={`lesson-screen ${className}`} aria-labelledby={id}>
      <header className="lesson-heading">
        <Heading id={id}>{title}</Heading>
        {description && <p>{description}</p>}
      </header>
      <div className={`lesson-body ${visual ? "" : "lesson-body-wide"}`}>
        {visual && <div className="lesson-visual">{visual}</div>}
        <div className="lesson-copy">{children}</div>
      </div>
    </section>
  );
}
