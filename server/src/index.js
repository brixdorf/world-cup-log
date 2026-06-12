"use strict";

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { initDb } = require("./db/database");
const authRoutes = require("./routes/auth");
const matchesRoutes = require("./routes/matches");
const personalRoutes = require("./routes/personal");
const exportImportRoutes = require("./routes/exportImport");
const { startRefreshJob } = require("./jobs/refreshMatches");

const app = express();
const PORT = process.env.PORT || 3003;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // required so the browser sends the auth cookie cross-origin
  }),
);
app.use(express.json({ limit: "2mb" })); // limit protects against oversized import payloads
app.use(cookieParser());

// ── Database ────────────────────────────────────────────────────────────────
const db = initDb();

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes()); // auth has no DB queries so no db arg needed
app.use("/api/matches", matchesRoutes(db));
app.use("/api/personal", personalRoutes(db));
app.use("/api", exportImportRoutes(db)); // handles GET /api/export + POST /api/import

// ── Global error handler (Express 5 forwards async errors here automatically)
app.use((err, req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// ── Cron ────────────────────────────────────────────────────────────────────
startRefreshJob(db);

app.listen(PORT, () => {
  console.log(`World Cup Log server running on http://localhost:${PORT}`);
});
