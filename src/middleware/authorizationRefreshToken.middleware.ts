import { RequestHandler } from "express";
import { REFRESH_COOKIE_NAME } from "../consants/cookies.const";
import { jwtService } from "../auth/adapters/jwt.service";

export const authorizationRefreshTokenMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).send();
  }

  const result = jwtService.verifyRefreshToken(refreshToken);
  const expirationDate = new Date(Number(result?.exp ?? 0) * 1000);

  if (new Date() >= expirationDate) {
    return res.status(401).send("refresh_token expired");
  }

  if (!result) return res.status(401).send();

  if ("userId" in result) {
    req.userId = result.userId;
  }

  if ("deviceId" in result) {
    req.deviceId = result.deviceId;
  }

  if ("issuedAt" in result && typeof result.issuedAt === "string") {
    req.iat = new Date(result.issuedAt);
  }

  return next();
};
