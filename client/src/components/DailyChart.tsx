import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DailyCount } from '../lib/api';

interface Props {
  hailByDate: DailyCount[];
  windByDate: DailyCount[];
  showWind: boolean;
}

export default function DailyChart({ hailByDate, windByDate, showWind }: Props) {
  // Merge hail and wind counts by date
  const dateMap = new Map<string, { date: string; hail: number; wind: number }>();

  for (const d of hailByDate) {
    dateMap.set(d.date, { date: d.date, hail: d.count, wind: 0 });
  }
  if (showWind) {
    for (const d of windByDate) {
      const existing = dateMap.get(d.date);
      if (existing) {
        existing.wind = d.count;
      } else {
        dateMap.set(d.date, { date: d.date, hail: 0, wind: d.count });
      }
    }
  }

  const data = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Daily Hail{showWind ? ' & Wind' : ''} Event Counts
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v.slice(5)}
            fontSize={12}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="hail" fill="#3b82f6" name="Hail" />
          {showWind && <Bar dataKey="wind" fill="#22c55e" name="Wind" />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
