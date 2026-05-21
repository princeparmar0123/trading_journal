import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";

const TICK_STYLE = { fill: "#fafafa", fontSize: 11, fontWeight: 500 };
const LABEL_STYLE = {
  fill: "#ffffff",
  fontSize: 11,
  fontWeight: 600,
  textShadow: "0 1px 3px rgba(0,0,0,0.65)",
};

function formatPnlLabel(value: number) {
  const abs = Math.abs(value);
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0);
  return `${value >= 0 ? "+" : "-"}$${str}`;
}

function PnlLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  const isPositive = value >= 0;
  const labelX = isPositive ? x + width + 6 : x + width - 6;
  const anchor = isPositive ? "start" : "end";

  return (
    <text
      x={labelX}
      y={y + height / 2}
      dy={4}
      textAnchor={anchor}
      style={LABEL_STYLE}
    >
      {formatPnlLabel(value)}
    </text>
  );
}

export function SessionBar({
  data,
}: {
  data: { label: string; pnl: number; trades: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-56 place-items-center text-sm text-muted-foreground">
        No session data yet
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 6"
            horizontal={false}
          />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <XAxis
            type="number"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "rgba(15,15,18,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 12,
              color: "#fafafa",
            }}
            labelStyle={{ color: "#fafafa", fontWeight: 600 }}
            itemStyle={{ color: "#e4e4e7" }}
            formatter={(v: number, _n, item) => {
              const trades = (item?.payload as { trades?: number })?.trades ?? 0;
              const pnl = Number(v);
              return [
                `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} · ${trades} trades`,
                "P&L",
              ];
            }}
          />
          <Bar dataKey="pnl" radius={[0, 6, 6, 0]} barSize={26} minPointSize={4}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
            ))}
            <LabelList dataKey="pnl" content={<PnlLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
