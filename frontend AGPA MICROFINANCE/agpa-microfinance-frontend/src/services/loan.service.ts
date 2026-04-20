import API from "../api/axios";

/*
GET ALL LOANS
*/
export const getLoans = async () => {
  const res = await API.get("/loans");
  return res.data;
};

/*
GET ACTIVE LOANS (for payment dropdown)
*/
export const getActiveLoans = async () => {
  const res = await API.get("/loans/active");
  return res.data;
};

/*
CREATE LOAN
*/
export const createLoan = async (loanData: any) => {
  const res = await API.post("/loans", loanData);
  return res.data;
};

/*
UPDATE LOAN
*/
export const updateLoan = async (
  id: string,
  loanData: any
) => {
  const res = await API.put(`/loans/${id}`, loanData);
  return res.data;
};

/*
DELETE LOAN
*/
export const deleteLoan = async (id: string) => {
  const res = await API.delete(`/loans/${id}`);
  return res.data;
};