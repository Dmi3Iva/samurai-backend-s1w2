import { Schema, model } from "mongoose";
import { IUserType } from "./user-types";

export const userSchema = new Schema<IUserType>({
  login: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: Date,
  password: { type: String, required: true },
  emailConfirmation: {
    confirmationCode: String,
    expirationDate: Date,
    isConfirmed: Boolean,
  },
  passwordRecovery: {
    code: String,
    expirationDate: Date,
  },
});

export const UserModel = model("user", userSchema);
