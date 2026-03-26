import db from "./db";

interface HailRow {
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

interface WindRow {
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

function formatDateForSPC(date: Date): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function formatDateForDB(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseSPCCsv(csvText: string, date: string) {
  const lines = csvText.trim().split("\n");
  const hailReports: HailRow[] = [];
  const windReports: WindRow[] = [];

  let currentSection: "tornado" | "wind" | "hail" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section headers
    if (trimmed.startsWith("Time,F_Scale,")) {
      currentSection = "tornado";
      continue;
    }
    if (trimmed.startsWith("Time,Speed,")) {
      currentSection = "wind";
      continue;
    }
    if (trimmed.startsWith("Time,Size,")) {
      currentSection = "hail";
      continue;
    }

    const parts = trimmed.split(",");
    if (parts.length < 7) continue;

    if (currentSection === "hail") {
      const [time, sizeStr, location, county, state, latStr, lonStr, ...rest] =
        parts;
      const size = parseInt(sizeStr, 10);
      if (isNaN(size)) continue;
      hailReports.push({
        date,
        time: time.trim(),
        size,
        location: location.trim(),
        county: county.trim(),
        state: state.trim(),
        lat: parseFloat(latStr),
        lon: parseFloat(lonStr),
        comments: rest.join(",").trim(),
      });
    } else if (currentSection === "wind") {
      const [time, speedStr, location, county, state, latStr, lonStr, ...rest] =
        parts;
      const speed = speedStr.trim() === "UNK" ? 0 : parseInt(speedStr, 10);
      windReports.push({
        date,
        time: time.trim(),
        speed: isNaN(speed) ? 0 : speed,
        location: location.trim(),
        county: county.trim(),
        state: state.trim(),
        lat: parseFloat(latStr),
        lon: parseFloat(lonStr),
        comments: rest.join(",").trim(),
      });
    }
  }

  return { hailReports, windReports };
}

export function getDaysYTD(): number {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export async function fetchSPCData(days: number = 30): Promise<{
  hailCount: number;
  windCount: number;
  daysProcessed: number;
}> {
  let totalHail = 0;
  let totalWind = 0;
  let daysProcessed = 0;

  const insertHail = db.prepare(`
    INSERT OR IGNORE INTO hail_reports (date, time, size, location, county, state, lat, lon, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWind = db.prepare(`
    INSERT OR IGNORE INTO wind_reports (date, time, speed, location, county, state, lat, lon, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Clear existing data for the date range to avoid duplicates
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const spcDate = formatDateForSPC(date);
    const dbDate = formatDateForDB(date);
    const url = `https://www.spc.noaa.gov/climo/reports/${spcDate}_rpts.csv`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`  No data for ${dbDate} (${response.status})`);
        continue;
      }

      const csvText = await response.text();
      const { hailReports, windReports } = parseSPCCsv(csvText, dbDate);

      // Delete existing records for this date before inserting
      db.prepare("DELETE FROM hail_reports WHERE date = ?").run(dbDate);
      db.prepare("DELETE FROM wind_reports WHERE date = ?").run(dbDate);

      const insertAll = db.transaction(() => {
        for (const r of hailReports) {
          insertHail.run(
            r.date,
            r.time,
            r.size,
            r.location,
            r.county,
            r.state,
            r.lat,
            r.lon,
            r.comments
          );
        }
        for (const r of windReports) {
          insertWind.run(
            r.date,
            r.time,
            r.speed,
            r.location,
            r.county,
            r.state,
            r.lat,
            r.lon,
            r.comments
          );
        }
      });

      insertAll();
      totalHail += hailReports.length;
      totalWind += windReports.length;
      daysProcessed++;
      console.log(
        `  ${dbDate}: ${hailReports.length} hail, ${windReports.length} wind reports`
      );
    } catch (err) {
      console.log(`  Error fetching ${dbDate}: ${err}`);
    }
  }

  return { hailCount: totalHail, windCount: totalWind, daysProcessed };
}
