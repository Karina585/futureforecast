import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleCard({ title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card">
      <button
        type="button"
        className="card-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="card-toggle-title">
          <h2>{title}</h2>
          {!open && summary && <span className="card-toggle-summary">{summary}</span>}
        </span>
        <span className={`chevron${open ? " chevron--open" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && <div className="card-toggle-body">{children}</div>}
    </section>
  );
}
