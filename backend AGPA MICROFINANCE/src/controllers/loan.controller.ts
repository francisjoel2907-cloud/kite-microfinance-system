import { Request, Response } from "express";

import Loan from "../models/loan.model";
import Customer from "../models/customer.model";


// GET ALL LOANS
export const getLoans = async (
  req: Request,
  res: Response
) => {
  try {

    const loans = await Loan.find()
      .populate("customerId")
      .lean();

    const today = new Date();

    const updatedLoans = await Promise.all(
      loans.map(async (loan) => {

        let newStatus: "Active" | "Completed" | "Overdue" = "Active";

        if (loan.balance === 0) {
          newStatus = "Completed";

          await Customer.findByIdAndUpdate(
            loan.customerId,
            { eligible: true }
          );

        } else if (
          today > loan.dueDate &&
          loan.balance > 0
        ) {
          newStatus = "Overdue";
        }

        if (loan.status !== newStatus) {
          await Loan.findByIdAndUpdate(
            loan._id,
            { status: newStatus }
          );

          loan.status = newStatus;
        }

        return loan;
      })
    );

    res.json(updatedLoans);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch loans"
    });

  }
};

export const getActiveLoans = async (req: Request, res: Response) => {
  try {

    const loans = await Loan.find({ status: "Active" })
      .populate("customerId")
      .lean();

    // ✅ FIX: remove broken loans (no customer)
    const cleanLoans = loans.filter((loan: any) => loan.customerId);

    res.json(cleanLoans);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch active loans"
    });
  }
};

export const getTodayLoans = async (
  req: Request,
  res: Response
) => {

  try {

    const today = new Date();

    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const loans = await Loan.find({
      issuedDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate("customerId");

    res.json(loans);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch today's loans"
    });

  }

};


// CREATE LOAN

export const createLoan = async (
  req: Request,
  res: Response
) => {
  try {

    const { customerId, loanAmount, issuedDate } = req.body;

    // VALIDATE LOAN RANGE
   if (loanAmount < 50000 || loanAmount > 1000000) {
    return res.status(400).json({
    message: "Loan amount must be between 50,000 and 1,000,000 Tsh"
    });
    }

    const customer = await Customer.findById(customerId);

      if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }
    if (!customer.eligible) {
  return res.status(400).json({
    message: "Customer is not eligible for a new loan"
  });
  }
    // CHECK IF CUSTOMER ALREADY HAS ACTIVE LOAN
    const existingLoan = await Loan.exists({
  customerId,
  status: { $in: ["Active", "Overdue"] }
});

if (existingLoan) {
  return res.status(400).json({
    message: "Customer already has an active loan"
  });
}

  

    const INTEREST_RATE = 0.30;
    const REPAYMENT_DAYS = 26;

    const profit = loanAmount * INTEREST_RATE;
    const totalPayment = loanAmount + profit;
    const dailyPayment = Math.round(totalPayment / REPAYMENT_DAYS);

    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + REPAYMENT_DAYS);

    const newLoan = await Loan.create({
      customerId,
      loanAmount,
      issuedDate,
      profit,
      totalPayment,
      dailyPayment,
      repaymentDays: REPAYMENT_DAYS,
      dueDate,
      balance: totalPayment,
      progress: 0,
      status: "Active"
    });

     await Customer.findByIdAndUpdate(
     customerId,
     { eligible: false }
     );

    res.status(201).json(newLoan);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to create loan"
    });

  }
};


// UPDATE LOAN
export const updateLoan = async (
  req: Request,
  res: Response
) => {
  try {

    const { loanAmount, issuedDate } = req.body;
    // VALIDATE LOAN RANGE
   if (loanAmount < 50000 || loanAmount > 1000000) {
    return res.status(400).json({
    message: "Loan amount must be between 50,000 and 1,000,000 Tsh"
    });
    }

    const INTEREST_RATE = 0.30;
    const REPAYMENT_DAYS = 26;

    const profit = loanAmount * INTEREST_RATE;
    const totalPayment = loanAmount + profit;
    const dailyPayment = Math.round(totalPayment / REPAYMENT_DAYS);

    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + REPAYMENT_DAYS); 
   
    const existingLoan = await Loan.findById(req.params.id);

    if (!existingLoan) {
    return res.status(404).json({
    message: "Loan not found"
    });
    }

   const totalPaid = existingLoan.totalPaid;

   const balance = totalPayment - totalPaid;

   const progress = Math.round(
   (totalPaid / totalPayment) * 100
   );
   let status = "Active";

   if (balance === 0) {
    status = "Completed";
    }
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
     {
      loanAmount,
      issuedDate,
      profit,
      totalPayment,
      dailyPayment,
      dueDate,
      repaymentDays: REPAYMENT_DAYS,
      balance,
      progress,
      status
      } ,
      { new: true }
    );

    res.json(updatedLoan);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to update loan"
    });

  }
};


// DELETE LOAN
export const deleteLoan = async (
  req: Request,
  res: Response
) => {
  try {

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
     return res.status(404).json({
     message: "Loan not found"
     });
     }

     await Customer.findByIdAndUpdate(
     loan.customerId,
     { eligible: true }
     );

     await loan.deleteOne();

     res.json({
      message: "Loan deleted successfully"
        });

      } catch (error) {

    res.status(500).json({
      message: "Failed to delete loan"
    });

  }
}; 