import express from "express";

import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  getTodayLoans,
  getActiveLoans
} from "../controllers/loan.controller";

import protect from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", protect, getLoans);

router.get("/active", getActiveLoans);

router.post("/", protect, createLoan);

router.put("/:id", protect, updateLoan);

router.delete("/:id", protect, deleteLoan);

router.get(
"/today",
protect,
getTodayLoans
);

export default router;