import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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
    return res.status(401).send("jwt is correct but expired");
  }

  if (!decoded) {
    return res.status(401).send("incorrect jwt token");
  }

  req.userId = decoded?.userId;
  next();
};
