import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export function WinLossPie({ wins, losses, breakevens }: { wins: number; losses: number; breakevens: number }) {
  const data = [
    { name: "Wins", value: wins, fill: "var(--profit)" },
    { name: "Losses", value: losses, fill: "var(--loss)" },
    { name: "BE", value: breakevens, fill: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div className="grid h-64 place-items-center text-sm text-muted-foreground">No data yet</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={92}
            paddingAngle={3}
            stroke="var(--background)"
            strokeWidth={3}
            dataKey="value"
          >
            {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
