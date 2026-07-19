import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "../lib/mortgage";
import { formatCurrency, formatMonthYear } from "../lib/format";

interface Props {
  points: MonthPoint[];
  payoffMonthIndex: number | null;
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
      <div className="chart-tooltip-title">{formatMonthYear(label ?? "")}</div>
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
    "Loan balance": Math.round(p.loanBalance),
    "Offset balance": Math.round(p.offsetBalance),
    "Net worth": Math.round(p.netWorth),
  }));

  const tickEvery = Math.max(1, Math.floor(points.length / 8));

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatMonthYear}
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
          <Line
            type="monotone"
            dataKey="Loan balance"
            stroke="var(--series-loan)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Offset balance"
            stroke="var(--series-offset)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Net worth"
            stroke="var(--series-networth)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
