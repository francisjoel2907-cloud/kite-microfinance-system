import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
{
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  loanAmount: {
    type: Number,
    required: true
  },

  profit: {
    type: Number,
    required: true
  },

  totalPayment: {
    type: Number,
    required: true
  },

  totalPaid: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    required: true
  },
  progress: {
  type: Number,
  default: 0
},

  repaymentDays: {
    type: Number,
    required: true
  },

  dailyPayment: {
    type: Number,
    required: true
  },

  issuedDate: {
    type: Date,
    required: true
  },

  dueDate: {
    type: Date,
    required: true
  },

  lastPaymentDate: {
    type: Date
  },

 status: {
  type: String,
  enum: ["Active", "Completed", "Overdue"],
  default: "Active"
}

},
{ timestamps: true }
);

export default mongoose.model(
"Loan",
loanSchema
);