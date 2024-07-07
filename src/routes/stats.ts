import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  getBarCharts,
  getDashboardStats,
  getLineCharts,
  getPieCharts,
} from "../controllers/stats.js";

const app = express.Router();

// route - /api/v1/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);

// route - /api/v1/dashboard/pie
app.get("/pie",  getPieCharts);

// route - /api/v1/dashboard/bar
app.get("/bar", getBarCharts);

// route - /api/v1/dashboard/line
app.get("/line",  getLineCharts);

export default app;