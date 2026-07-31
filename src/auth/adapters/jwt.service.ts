import jwt, { JwtPayload } from "jsonwebtoken";
import { appConfig } from "../../common/appConfig";
import { milliseconds } from "date-fns/fp";
import {
  IAuthType,
  ITokenPayload,
} from "../../features/auth/models/auth.model";

export enum ETokenType {
  Access,
  Refresh,
}

export const jwtService = {
  // create token
  createAccessToken(tokenPayload: ITokenPayload) {
    return this._createToken(tokenPayload, ETokenType.Access);
  },
  createRefreshToken(tokenPayload: ITokenPayload) {
    return this._createToken(tokenPayload, ETokenType.Refresh);
  },
  _createToken(tokenPayload: ITokenPayload, type: ETokenType) {
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

    const jwtToken = jwt.sign(tokenPayload, secret, {
      expiresIn: Number(time) / 1000 || 300,
      jwtid: crypto.randomUUID(),
    });

    return jwtToken;
  },
  createTokensPair(tokenPayload: ITokenPayload): [string, string] {
    return [
      this.createAccessToken(tokenPayload),
      this.createRefreshToken(tokenPayload),
    ];
  },

  // verify token
  verifyToken(token: string, type: ETokenType) {
    try {
      const secret =
        type === ETokenType.Access
          ? appConfig.JWT_SECRET
          : appConfig.JWT_REFRESH_SECRET;
      return jwt.verify(token, secret) as JwtPayload;
    } catch (e) {
      console.error("token verify error");
      return null;
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
