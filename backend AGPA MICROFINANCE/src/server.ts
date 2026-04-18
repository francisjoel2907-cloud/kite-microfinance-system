import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customer.routes";
import loanRoutes from "./routes/loan.routes";
import paymentRoutes from "./routes/payment.routes";

dotenv.config();

connectDB();

const app = express();

/*
MIDDLEWARE
*/

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments",paymentRoutes);

app.get("/", (_, res) => {
  res.send("Microfinance API running...");
});

/*
PORT
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);