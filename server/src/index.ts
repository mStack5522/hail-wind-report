import express from "express";
import cors from "cors";
import reportRoutes from "./routes/reports";
import { fetchSPCData, getDaysYTD } from "./fetch-spc";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/api", reportRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Hail & Wind Report API" });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const db = (await import("./db")).default;
  const count = db
    .prepare(
      "SELECT COUNT(*) as c FROM hail_reports UNION ALL SELECT COUNT(*) as c FROM wind_reports"
    )
    .all() as any[];
  const total = count.reduce((sum: number, r: any) => sum + r.c, 0);

  const ytdDays = getDaysYTD();

  if (total === 0) {
    // First run: fetch YTD data
    console.log(`Database is empty. Fetching YTD data (${ytdDays} days)...`);
    try {
      const result = await fetchSPCData(ytdDays);
      console.log(
        `Done! Loaded ${result.hailCount} hail and ${result.windCount} wind reports.`
      );
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    }
  } else {
    // Subsequent runs: refresh last 7 days to pick up new/updated reports
    console.log(`Database has ${total} existing reports. Refreshing last 7 days...`);
    try {
      const result = await fetchSPCData(7);
      console.log(
        `Refreshed: ${result.hailCount} hail and ${result.windCount} wind reports.`
      );
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  }
});
