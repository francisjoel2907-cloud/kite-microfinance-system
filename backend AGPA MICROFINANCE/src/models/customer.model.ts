import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
    },

    clientPhone: {
      type: String,
      required: true,
    },

    clientLocation: {
      type: String,
      required: true,
    },

    clientGuaranteeItem: {
      type: String,
      required: true,
    },

    guarantorName: {
      type: String,
      required: true,
    },

    guarantorPhone: {
      type: String,
      required: true,
    },

    guarantorLocation: {
      type: String,
      required: true,
    },

    guarantorItem: {
      type: String,
      required: true,
    },

    chairpersonName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

  eligible: {
    type: Boolean,
    default: true
  },

    joinedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", customerSchema);