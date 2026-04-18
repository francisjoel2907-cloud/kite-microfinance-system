import express from "express";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";

import protect from "../middleware/auth.middleware";

const router = express.Router();


router.get("/", protect, getCustomers);

router.post("/", protect, createCustomer);

router.put("/:id", protect, updateCustomer);

router.delete("/:id", protect, deleteCustomer);


export default router;