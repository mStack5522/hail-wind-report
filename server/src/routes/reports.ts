import { Router, Request, Response } from "express";
import db from "../db";
import { fetchSPCData, fetchSPCDataForYear, getDaysYTD } from "../fetch-spc";

const router = Router();

// GET /api/hail — list hail reports with optional filters
router.get("/hail", (req: Request, res: Response) => {
  const { start, end, state, limit = "500" } = req.query;

  let sql = "SELECT * FROM hail_reports WHERE 1=1";
  const params: any[] = [];

  if (start) {
    sql += " AND date >= ?";
    params.push(start);
  }
  if (end) {
    sql += " AND date <= ?";
    params.push(end);
  }
  if (state) {
    sql += " AND state = ?";
    params.push(String(state).toUpperCase());
  }

  sql += " ORDER BY date DESC, time DESC LIMIT ?";
  params.push(parseInt(String(limit), 10));

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/wind — list wind reports with optional filters
router.get("/wind", (req: Request, res: Response) => {
  const { start, end, state, limit = "500" } = req.query;

  let sql = "SELECT * FROM wind_reports WHERE 1=1";
  const params: any[] = [];

  if (start) {
    sql += " AND date >= ?";
    params.push(start);
  }
  if (end) {
    sql += " AND date <= ?";
    params.push(end);
  }
  if (state) {
    sql += " AND state = ?";
    params.push(String(state).toUpperCase());
  }

  sql += " ORDER BY date DESC, time DESC LIMIT ?";
  params.push(parseInt(String(limit), 10));

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

function getYearSummary(yearStart: string, yearEnd: string) {
  const hailCount = db
    .prepare("SELECT COUNT(*) as count FROM hail_reports WHERE date >= ? AND date <= ?")
    .get(yearStart, yearEnd) as any;
  const windCount = db
    .prepare("SELECT COUNT(*) as count FROM wind_reports WHERE date >= ? AND date <= ?")
    .get(yearStart, yearEnd) as any;
  const maxHail = db
    .prepare("SELECT MAX(size) as max_size FROM hail_reports WHERE date >= ? AND date <= ?")
    .get(yearStart, yearEnd) as any;
  const maxWind = db
    .prepare("SELECT MAX(speed) as max_speed FROM wind_reports WHERE speed > 0 AND date >= ? AND date <= ?")
    .get(yearStart, yearEnd) as any;
  const dateRange = db
    .prepare(
      `SELECT MIN(date) as earliest, MAX(date) as latest FROM (
        SELECT date FROM hail_reports WHERE date >= ? AND date <= ?
        UNION ALL SELECT date FROM wind_reports WHERE date >= ? AND date <= ?
      )`
    )
    .get(yearStart, yearEnd, yearStart, yearEnd) as any;

  const hailByDate = db
    .prepare(
      "SELECT date, COUNT(*) as count FROM hail_reports WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date"
    )
    .all(yearStart, yearEnd);
  const windByDate = db
    .prepare(
      "SELECT date, COUNT(*) as count FROM wind_reports WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date"
    )
    .all(yearStart, yearEnd);

  const topHailStates = db
    .prepare(
      "SELECT state, COUNT(*) as count FROM hail_reports WHERE date >= ? AND date <= ? GROUP BY state ORDER BY count DESC LIMIT 10"
    )
    .all(yearStart, yearEnd);
  const topWindStates = db
    .prepare(
      "SELECT state, COUNT(*) as count FROM wind_reports WHERE date >= ? AND date <= ? GROUP BY state ORDER BY count DESC LIMIT 10"
    )
    .all(yearStart, yearEnd);

  return {
    totalHailReports: hailCount.count,
    totalWindReports: windCount.count,
    maxHailSize: maxHail.max_size,
    maxWindSpeed: maxWind.max_speed,
    dateRange: { earliest: dateRange.earliest, latest: dateRange.latest },
    hailByDate,
    windByDate,
    topHailStates,
    topWindStates,
  };
}

// GET /api/summary — nationwide summary stats, with optional compareYear
router.get("/summary", (req: Request, res: Response) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const currentStart = `${currentYear}-01-01`;
  const currentEnd = `${currentYear}-${mm}-${dd}`;
  const current = getYearSummary(currentStart, currentEnd);

  const compareYear = req.query.compareYear ? parseInt(String(req.query.compareYear), 10) : null;
  let compare = null;

  if (compareYear && compareYear >= 2016 && compareYear <= currentYear - 1) {
    const compareStart = `${compareYear}-01-01`;
    const compareEnd = `${compareYear}-${mm}-${dd}`;
    compare = { year: compareYear, ...getYearSummary(compareStart, compareEnd) };
  }

  res.json({ ...current, year: currentYear, compare });
});

// POST /api/fetch-historic — fetch historical year data from SPC
router.post("/fetch-historic", async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year), 10);
  const now = new Date();
  if (!year || year < 2016 || year >= now.getFullYear()) {
    res.status(400).json({ success: false, error: "Invalid year. Must be 2016 to " + (now.getFullYear() - 1) });
    return;
  }

  // Check if we already have data for this year
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-${mm}-${dd}`;
  const existing = db
    .prepare("SELECT COUNT(*) as count FROM hail_reports WHERE date >= ? AND date <= ?")
    .get(yearStart, yearEnd) as any;

  if (existing.count > 0) {
    res.json({ success: true, message: `Already have ${existing.count} hail reports for ${year}`, alreadyLoaded: true });
    return;
  }

  console.log(`Fetching historic SPC data for ${year}...`);
  try {
    const result = await fetchSPCDataForYear(year);
    res.json({
      success: true,
      message: `Fetched ${result.hailCount} hail and ${result.windCount} wind reports for ${year}`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/fetch — trigger data fetch from SPC
router.post("/fetch", async (req: Request, res: Response) => {
  const days = req.query.days === "ytd"
    ? getDaysYTD()
    : parseInt(String(req.query.days || getDaysYTD()), 10);
  console.log(`Fetching SPC data for the last ${days} days...`);

  try {
    const result = await fetchSPCData(days);
    res.json({
      success: true,
      message: `Fetched ${result.hailCount} hail and ${result.windCount} wind reports over ${result.daysProcessed} days`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
