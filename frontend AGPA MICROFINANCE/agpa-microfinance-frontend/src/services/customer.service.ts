import API from "../api/axios";

/*
GET ALL CUSTOMERS
*/
export const getCustomers = async () => {
  const res = await API.get("/customers");
  return res.data;
};

/*
GET SINGLE CUSTOMER
*/
export const getCustomerById = async (id: string) => {
  const res = await API.get(`/customers/${id}`);
  return res.data;
};

/*
CREATE CUSTOMER
*/
export const createCustomer = async (data: any) => {
  const res = await API.post("/customers", data);
  return res.data;
};

/*
UPDATE CUSTOMER
*/
export const updateCustomer = async (
  id: string,
  data: any
) => {
  const res = await API.put(`/customers/${id}`, data);
  return res.data;
};

/*
DELETE CUSTOMER
*/
export const deleteCustomer = async (id: string) => {
  const res = await API.delete(`/customers/${id}`);
  return res.data;
};