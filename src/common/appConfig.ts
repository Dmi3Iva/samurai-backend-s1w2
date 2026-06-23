import { config } from "dotenv";

config();

export const appConfig = {
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  // Access Time
  AC_TIME: process.env.AC_TIME as string,
  RT_TIME: process.env.RT_TIME as string,
  SEND_MAIL_API_KEY: process.env.SEND_MAIL_API_KEY as string,
  FRONT_URL: process.env.FRONT_URL as string,
};
