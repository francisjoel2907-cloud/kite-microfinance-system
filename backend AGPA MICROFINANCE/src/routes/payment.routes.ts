import express from "express";

import protect from "../middleware/auth.middleware";

import {
recordPayment,
getPayments,
getCustomerPayments,
getLoanPayments,
getTodayPayments,
getTodayPaymentsTotal
} from "../controllers/payment.controller";

const router = express.Router();


router.post(
"/",
protect,
recordPayment
);


router.get(
"/",
protect,
getPayments
);


router.get(
"/customer/:customerId",
protect,
getCustomerPayments
);


router.get(
"/loan/:loanId",
protect,
getLoanPayments
);

router.get(
"/today",
protect,
getTodayPayments
);

router.get(
  "/today/total",
  protect,
  getTodayPaymentsTotal
);


export default router;