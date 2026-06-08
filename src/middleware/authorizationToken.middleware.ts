import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authorizationTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers["authorization"];

  const [authTitle, authToken] = authorizationHeader?.split(" ") || [];

  if (authTitle !== "Bearer") {
    return res.status(401).send("Incorrect token title");
  }
  if (!authToken?.length) {
    return res.status(401).send("Empty Basic token");
  }

  const decoded = await new Promise<{ userId: string } | null>((resolve) =>
    jwt.verify(authToken, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        resolve(null);
      }
      resolve(decoded as { userId: string });
    }),
  );

  if (!decoded) {
    return res.status(401).send("incorrect jwt token");
  }

  req.userId = decoded?.userId;
  next();
};
