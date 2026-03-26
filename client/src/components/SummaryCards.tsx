import { Summary } from '../lib/api';

interface Props {
  summary: Summary | null;
  loading: boolean;
  showWind: boolean;
}

export default function SummaryCards({ summary, loading, showWind }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const hailCards = [
    {
      label: 'Hail Reports',
      value: summary.totalHailReports.toLocaleString(),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Max Hail Size',
      value: summary.maxHailSize
        ? `${(summary.maxHailSize / 100).toFixed(2)}"`
        : 'N/A',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const windCards = [
    {
      label: 'Wind Reports',
      value: summary.totalWindReports.toLocaleString(),
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Max Wind Gust',
      value: summary.maxWindSpeed ? `${summary.maxWindSpeed} mph` : 'N/A',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  const cards = showWind ? [...hailCards, ...windCards] : hailCards;
  const cols = showWind ? 'md:grid-cols-4' : 'md:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${cols} gap-4 mb-6`}>
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-lg shadow p-6`}
        >
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
