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
        {/*
          The lesson column IS the receipt (design.md §2: "the lesson printed
          on a receipt to the right"). That means children must not be
          receipts themselves — a receipt never sits inside a receipt. Chapters
          group their content with dashed rules instead.
        */}
        <div className="lesson-copy receipt receipt-edge">{children}</div>
      </div>
    </section>
  );
}
