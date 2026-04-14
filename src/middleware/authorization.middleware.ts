import type { NextFunction, Request, Response } from "express";

const ADMIN_LOGIN = "admin";
const ADMIN_PASS = "qwerty";

export const authorizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorizationHeader = req.headers["authorization"];
  const authToken = authorizationHeader?.substring("Basic ".length);
  if (!authToken) {
    return res.status(401).send("Empty Basic token");
  }
  const decodedString = Buffer.from(authToken, "base64").toString("utf-8");
  const [login, password] = decodedString.split(":");
  if (login !== ADMIN_LOGIN || ADMIN_PASS !== password) {
    return res.status(401).send("Incorrect login and password");
  }

  next();
};
