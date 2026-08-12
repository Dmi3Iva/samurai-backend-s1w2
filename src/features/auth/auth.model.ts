import { model, Schema } from "mongoose";

const AuthModelSchema = new Schema({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  iat: { type: Date, required: true },
  deviceName: { type: String, required: true },
  ip: { type: String, required: true },
  exp: { type: Date, required: true },
});

export const AuthModel = model("auth", AuthModelSchema);
