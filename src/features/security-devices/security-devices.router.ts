import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { authorizationRefreshTokenMiddleware } from "../../middleware/authorizationRefreshToken.middleware";
import { authService } from "../auth/auth.service";
import { ERemoveSingleUserSessionState } from "../auth/models/auth.constants";

export const securityDeviceRouter = Router();

securityDeviceRouter.get(
  "/",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {
    if (!req.userId) {
      return res.status(400).send("not enough data to get user sessions");
    }
    const sessions = await authService.getUserSessions(req.userId);
    return res.status(200).send(sessions);
  },
);
securityDeviceRouter.delete(
  "/",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {
    if (!req.userId || !req.deviceId) {
      return res.status(401).send("no userId");
    }
    await authService.removeUserSessions(req.userId, req.deviceId);

    return res.status(204).send();
  },
);
securityDeviceRouter.delete(
  "/:deviceId",
  authorizationRefreshTokenMiddleware,
  async (req, res) => {
    const deviceId = req.params.deviceId;
    if (typeof deviceId !== "string" || !deviceId || !req.userId) {
      return res.status(401).send("not enough data to remove deviceId");
    }

    const removeResponse = await authService.removeSingleUserSession(
      req.userId,
      deviceId,
    );

    if (removeResponse === ERemoveSingleUserSessionState.FORBIDDEN) {
      return res.status(403).send("it is not your session");
    }

    if (removeResponse === ERemoveSingleUserSessionState.NOT_FOUND) {
      return res.status(404).send("session not found");
    }

    return res.status(204).send();
  },
);
