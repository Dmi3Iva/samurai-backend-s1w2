import { Router } from "express";
import { authorizationRefreshTokenMiddleware } from "../../middleware/authorizationRefreshToken.middleware";
import { AuthService } from "../auth/auth.service";
import { ERemoveSingleUserSessionState } from "../auth/models/auth.constants";

export class SecurityDeviceController {
  router = Router();
  constructor(private authService: AuthService) {
    this.registerGet();
    this.registerDelete();
    this.registerDeleteById();
  }

  getRouter() {
    return this.router;
  }

  registerGet() {
    this.router.get(
      "/",
      authorizationRefreshTokenMiddleware,
      async (req, res) => {
        if (!req.userId) {
          return res.status(400).send("not enough data to get user sessions");
        }
        const sessions = await this.authService.getUserSessions(req.userId);
        return res.status(200).send(sessions);
      },
    );
  }
  registerDelete() {
    this.router.delete(
      "/",
      authorizationRefreshTokenMiddleware,
      async (req, res) => {
        if (!req.userId || !req.deviceId) {
          return res.status(401).send("no userId");
        }
        await this.authService.removeUserSessions(req.userId, req.deviceId);

        return res.status(204).send();
      },
    );
  }
  registerDeleteById() {
    this.router.delete(
      "/:deviceId",
      authorizationRefreshTokenMiddleware,
      async (req, res) => {
        const deviceId = req.params.deviceId;
        if (typeof deviceId !== "string" || !deviceId || !req.userId) {
          return res.status(401).send("not enough data to remove deviceId");
        }

        const removeResponse = await this.authService.removeSingleUserSession(
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
  }
}
