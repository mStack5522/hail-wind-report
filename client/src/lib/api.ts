const BASE = '/api';

export interface HailReport {
  id: number;
  date: string;
  time: string;
  size: number;
  location: string;
  county: string;
  state: string;
  lat: number;
  lon: number;
  comments: string;
}

export interface WindReport {
  id: number;
  date: string;
  time: string;
  speed: number;
  location: string;
  county: string;
  state: string;
  lat: number;
  lon: number;
  comments: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface StateCount {
  state: string;
  count: number;
}

export interface YearSummary {
  totalHailReports: number;
  totalWindReports: number;
  maxHailSize: number | null;
  maxWindSpeed: number | null;
  dateRange: { earliest: string; latest: string };
  hailByDate: DailyCount[];
  windByDate: DailyCount[];
  topHailStates: StateCount[];
  topWindStates: StateCount[];
}

export interface Summary extends YearSummary {
  year: number;
  compare: (YearSummary & { year: number }) | null;
}

export async function fetchSummary(compareYear?: number): Promise<Summary> {
  const params = compareYear ? `?compareYear=${compareYear}` : '';
  const res = await fetch(`${BASE}/summary${params}`);
  return res.json();
}

export async function fetchHistoricData(year: number): Promise<any> {
  const res = await fetch(`${BASE}/fetch-historic?year=${year}`, { method: 'POST' });
  return res.json();
}

export async function fetchHailReports(params?: {
  start?: string;
  end?: string;
  state?: string;
  limit?: number;
}): Promise<HailReport[]> {
  const searchParams = new URLSearchParams();
  if (params?.start) searchParams.set('start', params.start);
  if (params?.end) searchParams.set('end', params.end);
  if (params?.state) searchParams.set('state', params.state);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const res = await fetch(`${BASE}/hail?${searchParams}`);
  return res.json();
}

export async function fetchWindReports(params?: {
  start?: string;
  end?: string;
  state?: string;
  limit?: number;
}): Promise<WindReport[]> {
  const searchParams = new URLSearchParams();
  if (params?.start) searchParams.set('start', params.start);
  if (params?.end) searchParams.set('end', params.end);
  if (params?.state) searchParams.set('state', params.state);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const res = await fetch(`${BASE}/wind?${searchParams}`);
  return res.json();
}

export async function triggerFetch(days: string | number = 'ytd'): Promise<any> {
  const res = await fetch(`${BASE}/fetch?days=${days}`, { method: 'POST' });
  return res.json();
}
