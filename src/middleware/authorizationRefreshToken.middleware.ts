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

  if (!result) return res.status(401).send();

  req.userId = (result as { userId: string }).userId;
  return next();
};
