import { Request, Response } from "express";

import Payment from "../models/payment.model";
import Loan from "../models/loan.model";
import Customer from "../models/customer.model";


export const recordPayment = async (
  req: Request,
  res: Response
) => {

  try {

    const {
      loanId,
      customerId,
      amountPaid,
      notes
    } = req.body;


    // VALIDATION
    if (!loanId || !customerId || !amountPaid) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    if (amountPaid <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero"
      });
    }


    // CHECK LOAN
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }


    // CHECK CUSTOMER
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }
    // VERIFY LOAN BELONGS TO CUSTOMER
     if (!loan.customerId.equals(customerId)) {
     return res.status(400).json({
     message: "Loan does not belong to this customer"
     });
     }


    // PREVENT OVERPAYMENT
    if (loan.status === "Completed") {
      return res.status(400).json({
      message: "Loan already completed"
      });
      }
    if (amountPaid > loan.balance) {
      return res.status(400).json({
        message: "Payment exceeds remaining balance"
      });
    }


    // CREATE PAYMENT RECORD
    const payment = await Payment.create({
      loanId,
      customerId,
      amountPaid,
      notes
    });


    // UPDATE LOAN TOTALS
    loan.totalPaid += amountPaid;

    loan.balance = Math.max(
    0,
    loan.totalPayment - loan.totalPaid
    );


    // UPDATE PROGRESS
    loan.progress = Math.min(
    100,
    Math.round(
   (loan.totalPaid / loan.totalPayment) * 100
   )
   );


    // UPDATE LAST PAYMENT DATE
    loan.lastPaymentDate = payment.paidDate;


    // CHECK COMPLETION
    if (loan.balance <= 0) {

      loan.status = "Completed";

      await Customer.findByIdAndUpdate(
        customerId,
        { eligible: true }
      );

    } else if (
       new Date() > loan.dueDate &&
       loan.balance > 0
       ) {
       loan.status = "Overdue";
       }
       else {
       loan.status = "Active";
       }


    await loan.save();


    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
      updatedLoan: loan
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Payment failed"
    });

  }

};

export const getPayments = async (
  req: Request,
  res: Response
) => {

  try {

    const payments = await Payment.find()
      .populate("customerId", "clientName clientPhone")
      .populate("loanId",
      "loanAmount totalPayment totalPaid balance progress lastPaymentDate status"
     );

    res.status(200).json(payments);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch payments"
    });

  }

};

export const getCustomerPayments = async (
  req: Request,
  res: Response
) => {

  try {

    const payments = await Payment.find({
      customerId: req.params.customerId
    })
      .populate("loanId");

    res.status(200).json(payments);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch customer payments"
    });

  }

};

export const getLoanPayments = async (
  req: Request,
  res: Response
) => {

  try {

    const payments = await Payment.find({
      loanId: req.params.loanId
    });

    res.status(200).json(payments);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch loan payments"
    });

  }

};

export const getTodayPayments = async (
  req: Request,
  res: Response
) => {

  try {

    const today = new Date();

    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const payments = await Payment.find({
      paidDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate("customerId", "clientName clientPhone")
    .populate("loanId");

    res.json(payments);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch today's payments"
    });

  }

};

export const getTodayPaymentsTotal = async (
  req: Request,
  res: Response
) => {

  try {

    const today = new Date();

    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);


    const payments = await Payment.find({
      paidDate: {
        $gte: today,
        $lt: tomorrow
      }
    });


    const totalCollected = payments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );


    res.json({
      totalCollected,
      count: payments.length
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch today's payment total"
    });

  }

};