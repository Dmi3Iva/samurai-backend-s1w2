import { Router, Request } from "express";
import { body, matchedData } from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { usersService } from "../users/users.service";
import { RequestWithBody } from "../../types/request.type";
import { jwtService } from "../../auth/adapters/jwt.service";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { IRegistrationBody as IRegistrationBody } from "./types/auth.router";
import { AuthService, authService } from "./auth.service";
import { EAuthRegistrationSTATUS } from "./constants/auth.service.const";
import { REFRESH_COOKIE_NAME } from "../../consants/cookies.const";
import { appConfig } from "../../common/appConfig";
import { authorizationRefreshTokenMiddleware } from "../../middleware/authorizationRefreshToken.middleware";
import { deviceNameMiddleware } from "../../middleware/device-name.middleware";
import { rateLimitMiddleware } from "../../middleware/rate-limit.middleware";

export interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

interface AuthMeParams {
  login: string;
  email: string;
  userId: string;
}

export const loginOrEmailValidator = body("loginOrEmail").exists().isString();

// login*	string
// maxLength: 10
// minLength: 3
// pattern: ^[a-zA-Z0-9_-]*$
// must be unique
const loginPattern = /^[a-zA-Z0-9_-]*$/;
const loginRegistartionValidator = body("login")
  .exists()
  .isString()
  .isLength({ min: 3, max: 10 })
  .matches(loginPattern);

// email*	string
// pattern: ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$
// example: example@example.dev
// must be unique
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const emailRegistrationValidator = body("email")
  .exists()
  .isString()
  .matches(emailPattern);

// password*	string
// maxLength: 20
// minLength: 6
export const passwordValidator = body("password").exists().isString();
const passwordRegistrationValidator = body("password")
  .exists()
  .isString()
  .isLength({ min: 6, max: 20 });
const codeValidator = body("code").exists().isString();

export class AuthController {
  private router = Router();
  constructor(private authService: AuthService) {
    this.registerLogin();
    this.registerLogout();
    this.registerRefreshToken();
    this.registerMe();
    this.registerRegistration();
    this.registerRegistrationConfirmation();
    this.registerRegistrationEmailResending();
  }

  getRouter() {
    return this.router;
  }

  registerLogin() {
    this.router.post(
      "/login",
      rateLimitMiddleware,
      loginOrEmailValidator,
      passwordValidator,
      inputValidationMiddleware,
      deviceNameMiddleware,
      async (req: RequestWithBody<LoginBodyParams>, res) => {
        const body = matchedData<LoginBodyParams>(req);
        const user = await usersService.isLoginOrEmailAndPasswordCorrected(
          body.loginOrEmail,
          body.password,
        );

        if (user === null) {
          return res.status(401).send();
        }

        const ip = req.ip;
        const deviceName = req.deviceName;

        if (!ip || !deviceName)
          return res.status(400).send("not enough data to register session");

        const session = await authService.registerSession({
          userId: user.id,
          deviceName,
          ip,
        });

        if (session === null) {
          return res.status(500).send();
        }

        const [accessToken, refreshToken] = session;

        const refreshTokenExpTime = Number(appConfig.RT_TIME);

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: refreshTokenExpTime,
        });
        return res.status(200).send({ accessToken });
      },
    );
  }

  registerLogout() {
    this.router.post(
      "/logout",
      authorizationRefreshTokenMiddleware,
      inputValidationMiddleware,
      async (req, res) => {
        const userId = req.userId as string;
        const deviceId = req.deviceId as string;
        const iat = req.iat;

        if (!userId || !deviceId || !iat) {
          return res.status(400).send("not enought data to logout");
        }

        const logoutSuccess = await authService.removeSession({
          userId,
          iat,
          deviceId,
        });

        if (logoutSuccess) {
          res.clearCookie(REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
          });
          return res.status(204).send();
        }

        return res.status(401).send();
      },
    );
  }

  registerRefreshToken() {
    return this.router.post(
      "/refresh-token",
      authorizationRefreshTokenMiddleware,
      inputValidationMiddleware,
      deviceNameMiddleware,
      async (req, res) => {
        // клиент отправляет на бек refreshToken в cookie,
        const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
        const userId = req.userId;
        const deviceId = req.deviceId;
        const iat = req.iat;
        const ip = req.ip;
        const deviceName = req.deviceName;

        if (!deviceName || !ip || !userId || !iat || !deviceId) {
          return res.status(400).send("not enough data to set session");
        }
        // мы должны вернуть новую пару токенов (старый refreshToken протухает, т.е. отмечаем refreshToken как невалидный);
        const result = await authService.updateSession(
          {
            userId,
            deviceId,
            iat,
            ip,
            deviceName,
          },
          refreshToken,
        );

        if (!result) {
          return res.status(401).send();
        }

        const refreshTokenExpTime = Number(appConfig.RT_TIME);
        const [newAccessToken, newRefreshToken] = result;
        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: refreshTokenExpTime,
        });

        return res.status(200).send({ accessToken: newAccessToken });
      },
    );
  }

  registerMe() {
    // возвращаем короткую инфу о текущем пользователе на основе accessToken.
    this.router.get(
      "/me",
      authorizationTokenMiddleware,
      inputValidationMiddleware,
      async (req: Request, res) => {
        const userId = req.userId;

        if (!userId) {
          return res.status(401).send();
        }

        const user = await usersService.getUserById(userId);

        if (!user) {
          return res.status(401).send();
        }
        const { email, login } = user;

        res.status(200).send({
          email,
          login,
          userId,
        });
      },
    );
  }

  registerRegistration() {
    this.router.post(
      "/registration",
      rateLimitMiddleware,
      loginRegistartionValidator,
      emailRegistrationValidator,
      passwordRegistrationValidator,
      inputValidationMiddleware,
      async (req: RequestWithBody<IRegistrationBody>, res) => {
        const registrationBody = matchedData<IRegistrationBody>(req);

        const result = await authService.registerUser(registrationBody);

        if (result !== EAuthRegistrationSTATUS.OK) {
          return res.status(400).send({
            errorsMessages: [
              {
                message: "something went wrong during registration",
                field:
                  result === EAuthRegistrationSTATUS.EMAIL_ERROR
                    ? "email"
                    : "login",
              },
            ],
          });
        }

        return res.status(204).send();
      },
    );
  }

  registerRegistrationConfirmation() {
    /**
     * Регистрирует пользователя в системе и отправляет ему confirmation code на email
     */
    this.router.post(
      "/registration-confirmation",
      rateLimitMiddleware,
      codeValidator,
      inputValidationMiddleware,
      async (req, res) => {
        const { code } = matchedData<{ code: string }>(req);

        const result = await authService.confirmRegistration(code);
        if (!result)
          return res.status(400).send({
            errorsMessages: [
              {
                message:
                  "confirmation code is incorrect, expired or already been applied",
                field: "code",
              },
            ],
          });

        return res.status(204).send();
      },
    );
  }

  registerRegistrationEmailResending() {
    this.router.post(
      "/registration-email-resending",
      rateLimitMiddleware,
      emailRegistrationValidator,
      inputValidationMiddleware,
      async (req, res) => {
        const { email } = matchedData<{ email: string }>(req);
        const result = await authService.registrationEmailResending(email);

        if (!result) {
          return res.status(400).send({
            errorsMessages: [
              {
                message: "smth wrong with email",
                field: "email",
              },
            ],
          });
        }

        return res.status(204).send();
      },
    );
  }
}

export const authController = new AuthController(authService);
