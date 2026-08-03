import { RequestHandler } from "express";
import { rateLimitService } from "../composition-root";

export const rateLimitMiddleware: RequestHandler = async (req, res, next) => {
  const ip = req.ip;
  const url = req.originalUrl;
  const checkRequestLimitPayload = {
    ip,
    url,
  };

  const result = await rateLimitService.checkRequestLimit(
    checkRequestLimitPayload,
  );

  if (result === false) {
    return res.status(429).send(`rate limit, try again later`);
  }

  return next();
};
