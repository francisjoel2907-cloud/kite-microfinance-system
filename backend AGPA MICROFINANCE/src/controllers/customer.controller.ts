import { Request, Response } from "express";
import Customer from "../models/customer.model";


// GET ALL CUSTOMERS
export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const customers = await Customer.find();

    res.json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
};


// CREATE CUSTOMER
export const createCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create customer",
    });
  }
};


// UPDATE CUSTOMER
export const updateCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update customer",
    });
  }
};


// DELETE CUSTOMER
export const deleteCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete customer",
    });
  }
};