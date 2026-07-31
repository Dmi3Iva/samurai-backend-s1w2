import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { authorizationRefreshTokenMiddleware } from "../../middleware/authorizationRefreshToken.middleware";
import { authService } from "../auth/auth.service";

export const securityDeviceRouter = Router();

securityDeviceRouter.get(
  "/",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {
    if (!req.userId) {
      return res.status(400).send("not enough data to get user sessions");
    }
    return authService.getUserSessions(req.userId);
  },
);
securityDeviceRouter.delete(
  "/",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {},
);
securityDeviceRouter.delete(
  "/:deviceId",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {},
);
