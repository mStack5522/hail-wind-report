import { Router, Request, Response } from "express";
import db from "../db";
import { fetchSPCData, getDaysYTD } from "../fetch-spc";

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

// GET /api/summary — nationwide summary stats
router.get("/summary", (_req: Request, res: Response) => {
  const hailCount = db
    .prepare("SELECT COUNT(*) as count FROM hail_reports")
    .get() as any;
  const windCount = db
    .prepare("SELECT COUNT(*) as count FROM wind_reports")
    .get() as any;
  const maxHail = db
    .prepare("SELECT MAX(size) as max_size FROM hail_reports")
    .get() as any;
  const maxWind = db
    .prepare("SELECT MAX(speed) as max_speed FROM wind_reports WHERE speed > 0")
    .get() as any;
  const dateRange = db
    .prepare(
      `SELECT MIN(date) as earliest, MAX(date) as latest FROM (
      SELECT date FROM hail_reports UNION ALL SELECT date FROM wind_reports
    )`
    )
    .get() as any;

  // Daily counts for charts
  const hailByDate = db
    .prepare(
      "SELECT date, COUNT(*) as count FROM hail_reports GROUP BY date ORDER BY date"
    )
    .all();
  const windByDate = db
    .prepare(
      "SELECT date, COUNT(*) as count FROM wind_reports GROUP BY date ORDER BY date"
    )
    .all();

  // Top states
  const topHailStates = db
    .prepare(
      "SELECT state, COUNT(*) as count FROM hail_reports GROUP BY state ORDER BY count DESC LIMIT 10"
    )
    .all();
  const topWindStates = db
    .prepare(
      "SELECT state, COUNT(*) as count FROM wind_reports GROUP BY state ORDER BY count DESC LIMIT 10"
    )
    .all();

  res.json({
    totalHailReports: hailCount.count,
    totalWindReports: windCount.count,
    maxHailSize: maxHail.max_size,
    maxWindSpeed: maxWind.max_speed,
    dateRange: { earliest: dateRange.earliest, latest: dateRange.latest },
    hailByDate,
    windByDate,
    topHailStates,
    topWindStates,
  });
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
