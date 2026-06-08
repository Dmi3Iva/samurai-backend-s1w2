import { config } from "dotenv";

config();

export const appConfig = {
  JWT_SECRET: process.env.JWT_SECRET as string,
  // Access Time
  AC_TIME: process.env.AC_TIME as string,
};
