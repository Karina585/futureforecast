import type { FundDestination, ScheduledEvent } from "../lib/mortgage";
import { newId } from "../lib/appState";
import { NumberField } from "./NumberField";

interface Props {
  events: ScheduledEvent[];
  onChange: (events: ScheduledEvent[]) => void;
}

const RECURRENCE_OPTIONS: { value: ScheduledEvent["recurrence"]; label: string }[] = [
  { value: "once", label: "One-off" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const REPAYMENT_ACCOUNT_OPTIONS: { value: FundDestination; label: string }[] = [
  { value: "offset", label: "Offset account" },
  { value: "principal", label: "Directly off the loan (permanent)" },
  { value: "savings", label: "Savings / transaction account" },
];

const REDRAW_ACCOUNT_OPTIONS: { value: FundDestination; label: string }[] = [
  { value: "offset", label: "Offset account" },
  { value: "savings", label: "Savings / transaction account" },
];

function makeEvent(kind: ScheduledEvent["kind"]): ScheduledEvent {
  return {
    id: newId(),
    label: kind === "repayment" ? "Extra repayment" : "Redraw",
    amount: kind === "repayment" ? 500 : 5000,
    kind,
    recurrence: kind === "repayment" ? "monthly" : "once",
    startDate: new Date().toISOString().slice(0, 10),
  };
}

export function EventsCard({ events, onChange }: Props) {
  const update = (id: string, patch: Partial<ScheduledEvent>) => {
    onChange(
      events.map((e) => {
        if (e.id === id) return { ...e, ...patch };
        // If the event being updated stops being a repayment, drop any
        // redraw that was linked to it as a contribution source.
        if (patch.kind && patch.kind !== "repayment" && e.linkedEventId === id) {
          return { ...e, linkedEventId: undefined };
        }
        return e;
      })
    );
  };
  const remove = (id: string) =>
    onChange(
      events
        .filter((e) => e.id !== id)
        .map((e) => (e.linkedEventId === id ? { ...e, linkedEventId: undefined } : e))
    );
  const add = (kind: ScheduledEvent["kind"]) => onChange([...events, makeEvent(kind)]);

  return (
    <section className="card events-card">
      <h2>Extra repayments &amp; redraws</h2>
      <p className="hint">
        Extra repayments can go into your offset account, straight off the
        loan principal (permanent — unlike offset money, it can't be
        redrawn), or into a savings/transaction account with no effect on the
        loan. Redraws pull money back out of offset or savings. Both can be
        one-off or on a recurring schedule. If a repayment is funded by
        selling investments, tick that box so it moves out of your
        investments balance instead of counting as new net worth. A redraw
        can also link to a recurring repayment — e.g. quarterly RSU tax
        set-asides swept out once a year to pay the ATO — in which case it
        automatically withdraws whatever that repayment has contributed
        since the last withdrawal, instead of a fixed amount.
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
                  <option value="repayment">Extra repayment</option>
                  <option value="redraw">Redraw</option>
                </select>
              </label>
              <label className="field">
                <span>Account</span>
                <select
                  value={event.account ?? "offset"}
                  onChange={(e) =>
                    update(event.id, { account: e.target.value as FundDestination })
                  }
                >
                  {(event.kind === "repayment"
                    ? REPAYMENT_ACCOUNT_OPTIONS
                    : REDRAW_ACCOUNT_OPTIONS
                  ).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {event.kind === "repayment" && (
                <label className="field checkbox">
                  <input
                    type="checkbox"
                    checked={event.fundedBySale ?? false}
                    onChange={(e) =>
                      update(event.id, { fundedBySale: e.target.checked })
                    }
                  />
                  <span>Funded by selling investments</span>
                </label>
              )}
              {event.kind === "redraw" && event.linkedEventId ? (
                <div className="field">
                  <span>Amount</span>
                  <span className="field-note">
                    Auto — sweeps whatever has accumulated
                  </span>
                </div>
              ) : (
                <label className="field">
                  <span>Amount</span>
                  <NumberField
                    min={0}
                    step={50}
                    value={event.amount}
                    onChange={(v) => update(event.id, { amount: v })}
                  />
                </label>
              )}
              {event.kind === "redraw" && (
                <label className="field">
                  <span>Link to contribution (optional)</span>
                  <select
                    value={event.linkedEventId ?? ""}
                    onChange={(e) => {
                      const linkedEventId = e.target.value || undefined;
                      const linked = events.find((ev) => ev.id === linkedEventId);
                      update(event.id, {
                        linkedEventId,
                        // Sweep from wherever the linked contribution actually went.
                        account: linked?.account ?? event.account,
                      });
                    }}
                  >
                    <option value="">None (fixed amount)</option>
                    {events
                      .filter(
                        (e) =>
                          e.kind === "repayment" &&
                          e.id !== event.id &&
                          (e.account ?? "offset") !== "principal"
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                  </select>
                </label>
              )}
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
