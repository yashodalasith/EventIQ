import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "organizer", "participant"],
      default: "participant",
    },
    profile: {
      admin: {
        department: { type: String, trim: true },
        employeeId: { type: String, trim: true },
      },
      organizer: {
        organization: { type: String, trim: true },
        phone: { type: String, trim: true },
        title: { type: String, trim: true },
      },
      participant: {
        institution: { type: String, trim: true },
        program: { type: String, trim: true },
        graduationYear: { type: Number },
      },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index(
  { "profile.admin.employeeId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "admin",
      "profile.admin.employeeId": { $type: "string" },
    },
  },
);

export const User = mongoose.model("User", userSchema);
