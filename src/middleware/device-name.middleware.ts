import { RequestHandler } from "express";
import { UAParser } from "ua-parser-js";

export const deviceNameMiddleware: RequestHandler = (req, res, next) => {
  const userAgentRaw = req.headers["user-agent"] || "unknown device";

  if (typeof userAgentRaw === "string") {
    const userAgent = UAParser(userAgentRaw);
    const deviceName = [
      ...Object.values(userAgent.device),
      ...Object.values(userAgent.browser),
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ");

    req.deviceName = deviceName || userAgentRaw || "unknown device";
  }

  return next();
};
