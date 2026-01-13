import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface DataPoint {
  date: string;
  value: number;
  note?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  unit: string;
  onPointClick?: (point: DataPoint) => void;
}

const ProgressChart = ({ data, title, unit, onPointClick }: ProgressChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-semibold">{point.date}</p>
          <p className="text-primary font-bold">
            {point.value} {unit}
          </p>
          {point.note && (
            <p className="text-muted-foreground text-xs mt-1">{point.note}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{
                fill: "hsl(var(--primary))",
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 5,
              }}
              activeDot={{
                fill: "hsl(var(--accent))",
                strokeWidth: 3,
                stroke: "hsl(var(--background))",
                r: 8,
                filter: "url(#glow)",
              }}
              filter="url(#glow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
