# Hail & Wind Report Dashboard

A full-stack weather reporting dashboard that displays hail and wind storm reports from the NOAA Storm Prediction Center (SPC). The app fetches year-to-date storm data, displays statistics, and provides interactive visualizations and data tables.

## Features

- Real-time data fetching from NOAA SPC's CSV feed (historical and daily updates)
- Toggle between hail and wind report views
- Summary statistics including total reports and max values
- Daily event count bar charts
- Top 10 states by report count rankings
- Searchable data tables showing recent reports
- Automatic data refresh — loads YTD data on first run, refreshes the last 7 days on subsequent runs

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React, TypeScript, Vite, TailwindCSS, Recharts  |
| Backend  | Express, TypeScript, TSX                         |
| Database | SQLite (better-sqlite3)                          |

## Getting Started

### Prerequisites

- Node.js 18+

### Install Dependencies

```bash
npm install
```

This installs dependencies for both the client and server workspaces.

### Run Locally

Start both the server and client simultaneously:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 — backend on http://localhost:3001
npm run dev:server

# Terminal 2 — frontend on http://localhost:5173
npm run dev:client
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build --workspace=client
npm run build --workspace=server
npm --workspace=server run start
```

## API Endpoints

| Method | Endpoint       | Description                                      |
| ------ | -------------- | ------------------------------------------------ |
| GET    | /api/summary   | Overall stats, daily counts, top states           |
| GET    | /api/hail      | Hail reports (query: start, end, state, limit)    |
| GET    | /api/wind      | Wind reports (query: start, end, state, limit)    |
| POST   | /api/fetch     | Trigger manual data fetch (query: days or "ytd")  |
