import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { IUserView } from "../features/users/models/users.model";

const ADMIN_LOGIN = "admin";
const ADMIN_PASS = "qwerty";

const AUTHORIZED_AUTH_TITLES = ["Basic", "Bearer"];

export const authorizationMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  const authorizationHeader = req.headers["authorization"];
  const [authTitle, authToken] = authorizationHeader?.split(" ") || [];
  if (
    typeof authTitle !== "string" ||
    !AUTHORIZED_AUTH_TITLES.includes(authTitle)
  ) {
    return res.status(401).send("Incorrect token title");
  }
  if (!authToken?.length) {
    return res.status(401).send("Empty token");
  }
  if (authTitle === "Basic") {
    const decodedString = Buffer.from(authToken, "base64").toString("utf-8");
    const [login, password] = decodedString.split(":");
    if (login !== ADMIN_LOGIN || ADMIN_PASS !== password) {
      return res.status(401).send("Incorrect login and password");
    }
  }

  if (authTitle === "Bearer") {
    const decodedString = await new Promise<{
      userId: string;
      deviceId: string;
      iat: string;
    } | null>((res) =>
      jwt.verify(authToken, process.env.JWT_SECRET!, function (err, decoded) {
        if (err) {
          res(null);
        }

        res(
          decoded as unknown as {
            userId: string;
            deviceId: string;
            iat: string;
          },
        );
      }),
    );

    if (!decodedString) {
      return res.status(401).send("Incorrect accesstoken");
    }

    req.userId = decodedString.userId;
    req.deviceId = decodedString.deviceId;
    req.iat = decodedString.iat;
  }

  next();
};
