import { config } from "dotenv";

config();

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-for-vitest";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-jwt-refresh-secret-for-vitest";
// AC_TIME and RT_TIME in .env are milliseconds (fallback: 10s / 20s)
process.env.AC_TIME = process.env.AC_TIME ?? "10000";
process.env.RT_TIME = process.env.RT_TIME ?? "20000";
