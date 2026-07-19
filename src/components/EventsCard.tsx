import type { ScheduledEvent } from "../lib/mortgage";
import { newEventId } from "../lib/appState";

interface Props {
  events: ScheduledEvent[];
  onChange: (events: ScheduledEvent[]) => void;
}

const RECURRENCE_OPTIONS: { value: ScheduledEvent["recurrence"]; label: string }[] = [
  { value: "once", label: "One-off" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function makeEvent(kind: ScheduledEvent["kind"]): ScheduledEvent {
  return {
    id: newEventId(),
    label: kind === "repayment" ? "Extra repayment" : "Redraw",
    amount: kind === "repayment" ? 500 : 5000,
    kind,
    recurrence: kind === "repayment" ? "monthly" : "once",
    startDate: new Date().toISOString().slice(0, 10),
  };
}

export function EventsCard({ events, onChange }: Props) {
  const update = (id: string, patch: Partial<ScheduledEvent>) => {
    onChange(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const remove = (id: string) => onChange(events.filter((e) => e.id !== id));
  const add = (kind: ScheduledEvent["kind"]) => onChange([...events, makeEvent(kind)]);

  return (
    <section className="card">
      <h2>Extra repayments &amp; redraws</h2>
      <p className="hint">
        Extra repayments top up your offset account; redraws pull money back out.
        Both can be one-off or on a recurring schedule.
      </p>

      {events.length === 0 && <p className="hint">No extra repayments or redraws yet.</p>}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id} className={`event-row event-row--${event.kind}`}>
            <div className="field-grid event-row-grid">
              <label className="field">
                <span>Label</span>
                <input
                  type="text"
                  value={event.label}
                  onChange={(e) => update(event.id, { label: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={event.kind}
                  onChange={(e) =>
                    update(event.id, { kind: e.target.value as ScheduledEvent["kind"] })
                  }
                >
                  <option value="repayment">Extra repayment (into offset)</option>
                  <option value="redraw">Redraw (out of offset)</option>
                </select>
              </label>
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={event.amount}
                  onChange={(e) => update(event.id, { amount: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>Frequency</span>
                <select
                  value={event.recurrence}
                  onChange={(e) =>
                    update(event.id, {
                      recurrence: e.target.value as ScheduledEvent["recurrence"],
                    })
                  }
                >
                  {RECURRENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{event.recurrence === "once" ? "Date" : "Start date"}</span>
                <input
                  type="date"
                  value={event.startDate}
                  onChange={(e) => update(event.id, { startDate: e.target.value })}
                />
              </label>
              {event.recurrence !== "once" && (
                <label className="field">
                  <span>End date (optional)</span>
                  <input
                    type="date"
                    value={event.endDate ?? ""}
                    onChange={(e) =>
                      update(event.id, { endDate: e.target.value || undefined })
                    }
                  />
                </label>
              )}
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${event.label}`}
              onClick={() => remove(event.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="quick-calc">
        <button type="button" className="ghost-button" onClick={() => add("repayment")}>
          + Add extra repayment
        </button>
        <button type="button" className="ghost-button" onClick={() => add("redraw")}>
          + Add redraw
        </button>
      </div>
    </section>
  );
}
