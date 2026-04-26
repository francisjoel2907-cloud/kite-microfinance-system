import { Request, Response } from "express";
import Loan from "../models/loan.model";
import Payment from "../models/payment.model";
import Customer from "../models/customer.model";

export const getReportSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const loans = await Loan.find();
    const payments = await Payment.find();
    const customers = await Customer.find();

    const totalDisbursed = loans.reduce(
      (sum, loan) => sum + loan.loanAmount,
      0
    );

    const totalCollected = payments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );

    const overdueLoans = loans.filter(
      (loan) => loan.status === "Overdue"
    ).length;

    const activeLoans = loans.filter(
      (loan) => loan.status === "Active"
    ).length;

    const completedLoans = loans.filter(
      (loan) => loan.status === "Completed"
    ).length;

    const collectionRate =
      totalDisbursed === 0
        ? 0
        : Math.round(
            (totalCollected / totalDisbursed) * 100
          );

    res.json({
      totalDisbursed,
      totalCollected,
      totalCustomers: customers.length,
      overdueLoans,
      activeLoans,
      completedLoans,
      collectionRate,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load report summary",
    });
  }
};