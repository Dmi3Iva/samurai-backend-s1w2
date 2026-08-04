import { RequestHandler } from "express";
import { iocContainer } from "../composition-root";
import { RateLimitService } from "../features/rate-limit/rate-limit.service";

export const rateLimitMiddleware: RequestHandler = async (req, res, next) => {
  const ip = req.ip;
  const url = req.originalUrl;
  const checkRequestLimitPayload = {
    ip,
    url,
  };

  const result = await iocContainer
    .get(RateLimitService)
    .checkRequestLimit(checkRequestLimitPayload);

  if (result === false) {
    return res.status(429).send(`rate limit, try again later`);
  }

  return next();
};
