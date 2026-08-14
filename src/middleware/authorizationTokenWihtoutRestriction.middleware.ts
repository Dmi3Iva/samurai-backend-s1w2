import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authorizationTokenWithoutRestriction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers["authorization"];

  const [authTitle, authToken] = authorizationHeader?.split(" ") || [];

  if (authTitle !== "Bearer") {
    return next();
  }
  if (!authToken?.length) {
    return next();
  }

  const decoded = await new Promise<JwtPayload | null>((resolve) =>
    jwt.verify(authToken, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        resolve(null);
      }
      resolve(decoded as JwtPayload);
    }),
  );

  const exp = new Date(Number(decoded?.exp ?? 0) * 1000);

  if (new Date() >= exp) {
    return next();
  }

  if (!decoded) {
    return next();
  }

  req.userId = decoded?.userId;
  next();
};
