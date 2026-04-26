import express from "express";
import { getReportSummary } from "../controllers/report.controller";
import protect from "../middleware/auth.middleware";

const router = express.Router();

router.get("/summary", protect, getReportSummary);

export default router;