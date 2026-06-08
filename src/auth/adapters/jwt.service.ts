import jwt from "jsonwebtoken";
import { appConfig } from "../../common/appConfig";

export const jwtService = {
  createToken(userId: string) {
    const { JWT_SECRET: jwtSecret, AC_TIME } = appConfig;
    if (!jwtSecret) {
      throw new Error("no JWT secret specified");
    }

    const jwtToken = jwt.sign({ userId }, jwtSecret, {
      expiresIn: Number(AC_TIME) || 300,
    });

    return jwtToken;
  },
  decodeToken(token: string): string | null {
    try {
      return jwt.decode(token) as string;
    } catch (e) {
      console.error("token decode error");
      return null;
    }
  },
  async verifyToken(token: string) {
    try {
      return jwt.verify(token, appConfig.JWT_SECRET);
    } catch (e) {
      console.error("token verify error");
      return false;
    }
  },
};
