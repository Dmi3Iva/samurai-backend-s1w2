import jwt from "jsonwebtoken";
import { appConfig } from "../../common/appConfig";

export enum ETokenType {
  Access,
  Refresh,
}

export const jwtService = {
  // create token
  createAccessToken(userId: string) {
    return this._createToken(userId, ETokenType.Access);
  },
  createRefreshToken(userId: string) {
    return this._createToken(userId, ETokenType.Refresh);
  },
  _createToken(userId: string, type: ETokenType) {
    const {
      JWT_SECRET: jwtSecret,
      JWT_REFRESH_SECRET: jwtRefreshSecret,
      AC_TIME,
      RT_TIME,
    } = appConfig;

    const secret = type === ETokenType.Access ? jwtSecret : jwtRefreshSecret;
    const time = type === ETokenType.Access ? AC_TIME : RT_TIME;
    if (!secret) {
      throw new Error("no JWT secret specified");
    }

    const jwtToken = jwt.sign({ userId }, secret, {
      expiresIn: Number(time) || 300,
    });

    return jwtToken;
  },
  createTokensPair(userId: string): [string, string] {
    return [this.createAccessToken(userId), this.createRefreshToken(userId)];
  },

  // verify token
  verifyToken(token: string, type: ETokenType) {
    try {
      const secret =
        type === ETokenType.Access
          ? appConfig.JWT_SECRET
          : appConfig.JWT_REFRESH_SECRET;
      return jwt.verify(token, secret);
    } catch (e) {
      console.error("token verify error");
      return false;
    }
  },
  verifyAccessToken(token: string) {
    return this.verifyToken(token, ETokenType.Access);
  },
  verifyRefreshToken(token: string) {
    return this.verifyToken(token, ETokenType.Refresh);
  },

  // decode token
  decodeToken(token: string): string | null {
    try {
      return jwt.decode(token) as string;
    } catch (e) {
      console.error("token decode error");
      return null;
    }
  },
};
