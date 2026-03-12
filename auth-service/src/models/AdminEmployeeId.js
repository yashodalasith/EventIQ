import mongoose from "mongoose";

const adminEmployeeIdSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["predefined", "manual"],
      default: "manual",
    },
    addedBy: { type: String, default: null },
  },
  { timestamps: true },
);

export const AdminEmployeeId = mongoose.model(
  "AdminEmployeeId",
  adminEmployeeIdSchema,
);
