import { useState, useEffect } from 'react';
import { HailReport, WindReport } from '../lib/api';

interface Props {
  hailReports: HailReport[];
  windReports: WindReport[];
  showWind: boolean;
}

type Tab = 'hail' | 'wind';

export default function ReportTable({ hailReports, windReports, showWind }: Props) {
  const [tab, setTab] = useState<Tab>('hail');

  // Reset to hail tab when wind is hidden
  useEffect(() => {
    if (!showWind && tab === 'wind') {
      setTab('hail');
    }
  }, [showWind, tab]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Recent Reports</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              tab === 'hail'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setTab('hail')}
          >
            Hail ({hailReports.length})
          </button>
          {showWind && (
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                tab === 'wind'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setTab('wind')}
            >
              Wind ({windReports.length})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 px-3 font-medium text-gray-500">Date</th>
              <th className="py-2 px-3 font-medium text-gray-500">Time</th>
              <th className="py-2 px-3 font-medium text-gray-500">
                {tab === 'hail' ? 'Size (in)' : 'Speed (mph)'}
              </th>
              <th className="py-2 px-3 font-medium text-gray-500">Location</th>
              <th className="py-2 px-3 font-medium text-gray-500">County</th>
              <th className="py-2 px-3 font-medium text-gray-500">State</th>
              <th className="py-2 px-3 font-medium text-gray-500">Comments</th>
            </tr>
          </thead>
          <tbody>
            {tab === 'hail'
              ? hailReports.slice(0, 100).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{r.date}</td>
                    <td className="py-2 px-3">{r.time}</td>
                    <td className="py-2 px-3 font-medium">
                      {(r.size / 100).toFixed(2)}"
                    </td>
                    <td className="py-2 px-3">{r.location}</td>
                    <td className="py-2 px-3">{r.county}</td>
                    <td className="py-2 px-3">{r.state}</td>
                    <td className="py-2 px-3 text-gray-500 max-w-xs truncate">
                      {r.comments}
                    </td>
                  </tr>
                ))
              : windReports.slice(0, 100).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{r.date}</td>
                    <td className="py-2 px-3">{r.time}</td>
                    <td className="py-2 px-3 font-medium">
                      {r.speed > 0 ? `${r.speed}` : 'UNK'}
                    </td>
                    <td className="py-2 px-3">{r.location}</td>
                    <td className="py-2 px-3">{r.county}</td>
                    <td className="py-2 px-3">{r.state}</td>
                    <td className="py-2 px-3 text-gray-500 max-w-xs truncate">
                      {r.comments}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
