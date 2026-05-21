import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export function MonthlyBar({ data }: { data: { month: string; pnl: number }[] }) {
  if (data.length === 0) {
    return <div className="grid h-64 place-items-center text-sm text-muted-foreground">No data yet</div>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            cursor={{ fill: "var(--accent)", fillOpacity: 0.25 }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, "PnL"]}
          />
          <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.month} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
