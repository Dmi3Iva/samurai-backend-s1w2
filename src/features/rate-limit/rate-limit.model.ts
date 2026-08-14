import { Schema, model } from "mongoose";

export interface IRateLimitType {
  ip: string;
  url: string;
  date: Date;
}

export const rateLimitSchema = new Schema<IRateLimitType>({
  ip: { type: String, required: true },
  url: { type: String, required: true },
  date: { type: Date, required: true },
});

export const RateLimitModel = model("rateLimit", rateLimitSchema);
