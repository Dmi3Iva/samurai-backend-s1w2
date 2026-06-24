import { RequestHandler } from "express";
import { REFRESH_COOKIE_NAME } from "../consants/cookies.const";
import { jwtService } from "../auth/adapters/jwt.service";
import { refreshTokenBlackListService } from "../features/refreshTokenBlacklist/refteshTokenBlackList.service";

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

  req.userId = (result as { userId: string }).userId;

  const isBlackListed = await refreshTokenBlackListService.isBlackListToken(
    result.userId,
    refreshToken,
  );

  if (isBlackListed) return res.status(401).send("токен в чёрном списке");

  return next();
};
