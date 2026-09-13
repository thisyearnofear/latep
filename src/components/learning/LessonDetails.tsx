import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function LessonDetails({
  trigger,
  title,
  children,
}: {
  trigger: string;
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialog.close();
    }
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="learning-button lesson-detail-trigger"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {trigger}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <dialog
            className="lesson-dialog"
            ref={dialogRef}
            aria-labelledby={id}
            onClose={() => triggerRef.current?.focus({ preventScroll: true })}
            onClick={onBackdropClick}
          >
            <header className="lesson-dialog-header">
              <h2 id={id}>{title}</h2>
              <button
                type="button"
                className="learning-button lesson-dialog-close"
                aria-label={`Close ${title}`}
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </header>
            <div className="lesson-dialog-body">{children}</div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
