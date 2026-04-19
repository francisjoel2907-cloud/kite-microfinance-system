import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  role: "admin" | "agent";
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    location: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "agent"],
      default: "admin",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },

  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);