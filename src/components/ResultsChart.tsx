import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NetWorthPoint } from "../lib/netWorth";
import { formatCurrency } from "../lib/format";

interface Props {
  points: NetWorthPoint[];
}

function yearLabel(iso: string): string {
  return iso.slice(0, 4);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{yearLabel(label ?? "")}</div>
      {payload.map((p) => (
        <div key={p.name} className="chart-tooltip-row">
          <span className="chart-tooltip-swatch" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{formatCurrency(p.value, true)}</strong>
        </div>
      ))}
    </div>
  );
}

export function ResultsChart({ points }: Props) {
  const data = points.map((p) => ({
    date: p.date,
    "Loan balance": -Math.round(p.loanBalance),
    "Offset balance": Math.round(p.offsetBalance),
    "Super balance": Math.round(p.superBalance),
    "Net worth": Math.round(p.netWorth),
  }));

  const tickEvery = Math.max(0, Math.ceil(data.length / 15) - 1);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={yearLabel}
            interval={tickEvery}
            stroke="var(--muted-ink)"
            tick={{ fill: "var(--muted-ink)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            stroke="var(--muted-ink)"
            tick={{ fill: "var(--muted-ink)", fontSize: 12 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "var(--secondary-ink)", fontSize: 13 }} />
          <ReferenceLine y={0} stroke="var(--baseline)" />
          <Bar dataKey="Loan balance" stackId="nw" fill="var(--series-loan)" />
          <Bar dataKey="Offset balance" stackId="nw" fill="var(--series-offset)" />
          <Bar dataKey="Super balance" stackId="nw" fill="var(--series-super)" />
          <Line
            type="monotone"
            dataKey="Net worth"
            stroke="var(--series-networth)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
