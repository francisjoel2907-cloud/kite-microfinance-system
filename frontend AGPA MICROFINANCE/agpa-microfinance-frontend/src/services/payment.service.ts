import API from "../api/axios";

/*
GET ACTIVE LOANS
*/
export const getActiveLoans = async () => {
  const res = await API.get("/loans/active");
  return res.data;
};

/*
GET ALL PAYMENTS
*/
export const getPayments = async () => {
  const res = await API.get("/payments");
  return res.data;
};

/*
GET TODAY PAYMENTS
*/
export const getTodayPayments = async () => {
  const res = await API.get("/payments/today");
  return res.data;
};

/*
RECORD PAYMENT
*/
export const recordPayment = async (data: {
  loanId: string;
  customerId: string;
  amountPaid: number;
  notes?: string;
}) => {
  const res = await API.post("/payments", data);
  return res.data;
};