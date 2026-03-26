import { useEffect, useState } from 'react';
import {
  fetchSummary,
  fetchHailReports,
  fetchWindReports,
  fetchHistoricData,
  triggerFetch,
  Summary,
  HailReport,
  WindReport,
} from '../lib/api';
import SummaryCards from './SummaryCards';
import DailyChart from './DailyChart';
import StateChart from './StateChart';
import ReportTable from './ReportTable';

const currentYear = new Date().getFullYear();
const COMPARE_YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [hailReports, setHailReports] = useState<HailReport[]>([]);
  const [windReports, setWindReports] = useState<WindReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const [loadingHistoric, setLoadingHistoric] = useState(false);

  const loadData = async (year?: number | null) => {
    setLoading(true);
    try {
      const [sum, hail, wind] = await Promise.all([
        fetchSummary(year ?? undefined),
        fetchHailReports({ limit: 500 }),
        fetchWindReports({ limit: 500 }),
      ]);
      setSummary(sum);
      setHailReports(hail);
      setWindReports(wind);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompareYearChange = async (year: number | null) => {
    setCompareYear(year);
    if (year) {
      setLoadingHistoric(true);
      try {
        await fetchHistoricData(year);
        await loadData(year);
      } catch (err) {
        console.error('Failed to load historic data:', err);
      } finally {
        setLoadingHistoric(false);
      }
    } else {
      await loadData(null);
    }
  };

  const handleFetchData = async () => {
    setFetching(true);
    try {
      await triggerFetch('ytd');
      await loadData(compareYear);
    } catch (err) {
      console.error('Failed to fetch SPC data:', err);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hail & Wind Report Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              NOAA Storm Prediction Center &mdash; {currentYear} Year to Date
              {compareYear && <> vs {compareYear}</>}
              {summary?.dateRange.earliest && summary?.dateRange.latest && (
                <> ({summary.dateRange.earliest} to {summary.dateRange.latest})</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Compare year dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Compare:</label>
              <select
                value={compareYear ?? ''}
                onChange={(e) =>
                  handleCompareYearChange(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                disabled={loadingHistoric}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">None</option>
                {COMPARE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {loadingHistoric && (
                <span className="text-xs text-gray-400">Loading...</span>
              )}
            </div>
            {/* Wind toggle */}
            <button
              onClick={() => setShowWind(!showWind)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                showWind
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}
            >
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  showWind ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    showWind ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
              Wind Data
            </button>
            <button
              onClick={handleFetchData}
              disabled={fetching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {fetching ? 'Fetching...' : 'Refresh SPC Data'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SummaryCards summary={summary} loading={loading} showWind={showWind} />

        {summary && (
          <>
            <DailyChart
              hailByDate={summary.hailByDate}
              windByDate={summary.windByDate}
              showWind={showWind}
              compare={summary.compare}
              currentYear={summary.year}
            />

            <div className={`grid grid-cols-1 ${showWind ? 'md:grid-cols-2' : ''} gap-6 mb-6`}>
              <StateChart
                title={`Top States — Hail${summary.compare ? ` (${summary.year})` : ''}`}
                data={summary.topHailStates}
                color="#3b82f6"
              />
              {showWind && (
                <StateChart
                  title={`Top States — Wind${summary.compare ? ` (${summary.year})` : ''}`}
                  data={summary.topWindStates}
                  color="#22c55e"
                />
              )}
            </div>
            {summary.compare && (
              <div className={`grid grid-cols-1 ${showWind ? 'md:grid-cols-2' : ''} gap-6 mb-6`}>
                <StateChart
                  title={`Top States — Hail (${summary.compare.year})`}
                  data={summary.compare.topHailStates}
                  color="#f4a261"
                />
                {showWind && (
                  <StateChart
                    title={`Top States — Wind (${summary.compare.year})`}
                    data={summary.compare.topWindStates}
                    color="#e9c46a"
                  />
                )}
              </div>
            )}
          </>
        )}

        <ReportTable
          hailReports={hailReports}
          windReports={windReports}
          showWind={showWind}
        />
      </main>
    </div>
  );
}
