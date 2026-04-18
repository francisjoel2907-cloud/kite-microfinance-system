import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  amountPaid: {
    type: Number,
    required: true,
    min: 1
  },

  paidDate: {
    type: Date,
    default: Date.now
  },

  notes: {
    type: String,
    default: ""
  }

},
{ timestamps: true }
);


// performance indexes
paymentSchema.index({ loanId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ paidDate: 1 });

export default mongoose.model(
"Payment",
paymentSchema
);