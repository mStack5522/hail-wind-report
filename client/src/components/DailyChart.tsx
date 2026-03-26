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
import { DailyCount, YearSummary } from '../lib/api';

interface Props {
  hailByDate: DailyCount[];
  windByDate: DailyCount[];
  showWind: boolean;
  compare: (YearSummary & { year: number }) | null;
  currentYear: number;
}

function toMonthDay(dateStr: string): string {
  return dateStr.slice(5); // "YYYY-MM-DD" -> "MM-DD"
}

interface ChartRow {
  monthDay: string;
  hail: number;
  wind: number;
  hailCompare: number;
  windCompare: number;
}

export default function DailyChart({ hailByDate, windByDate, showWind, compare, currentYear }: Props) {
  const dateMap = new Map<string, ChartRow>();

  const ensureRow = (md: string): ChartRow => {
    if (!dateMap.has(md)) {
      dateMap.set(md, { monthDay: md, hail: 0, wind: 0, hailCompare: 0, windCompare: 0 });
    }
    return dateMap.get(md)!;
  };

  for (const d of hailByDate) {
    ensureRow(toMonthDay(d.date)).hail = d.count;
  }
  if (showWind) {
    for (const d of windByDate) {
      ensureRow(toMonthDay(d.date)).wind = d.count;
    }
  }

  if (compare) {
    for (const d of compare.hailByDate) {
      ensureRow(toMonthDay(d.date)).hailCompare = d.count;
    }
    if (showWind) {
      for (const d of compare.windByDate) {
        ensureRow(toMonthDay(d.date)).windCompare = d.count;
      }
    }
  }

  const data = Array.from(dateMap.values()).sort((a, b) =>
    a.monthDay.localeCompare(b.monthDay)
  );

  const hailLabel = compare ? `Hail (${currentYear})` : 'Hail';
  const windLabel = compare ? `Wind (${currentYear})` : 'Wind';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Daily Hail{showWind ? ' & Wind' : ''} Event Counts
        {compare && ` — ${currentYear} vs ${compare.year}`}
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthDay" fontSize={12} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="hail" fill="#3b82f6" name={hailLabel} />
          {compare && (
            <Bar dataKey="hailCompare" fill="#f4a261" name={`Hail (${compare.year})`} />
          )}
          {showWind && <Bar dataKey="wind" fill="#22c55e" name={windLabel} />}
          {showWind && compare && (
            <Bar dataKey="windCompare" fill="#e9c46a" name={`Wind (${compare.year})`} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
