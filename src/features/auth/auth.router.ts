import { Router, Request } from "express";
import { body, matchedData } from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { usersService } from "../users/users.service";
import { RequestWithBody } from "../../types/request.type";
import { jwtService } from "../../auth/adapters/jwt.service";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { IRegistrationBody as IRegistrationBody } from "./types/auth.router";
import { authService } from "./auth.service";
import { EAuthRegistrationSTATUS } from "./constants/auth.service.const";
import { REFRESH_COOKIE_NAME } from "../../consants/cookies.const";
import { appConfig } from "../../common/appConfig";
import { refreshTokenBlackListService } from "../refreshTokenBlacklist/refteshTokenBlackList.service";
import { authorizationRefreshTokenMiddleware } from "../../middleware/authorizationRefreshToken.middleware";

export const authRouter = Router();

interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

interface AuthMeParams {
  login: string;
  email: string;
  userId: string;
}

const loginOrEmailValidator = body("loginOrEmail").exists().isString();
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
// TODO::
// password*	string
// maxLength: 20
// minLength: 6
const passwordValidator = body("password").exists().isString();
const passwordRegistrationValidator = body("password")
  .exists()
  .isString()
  .isLength({ min: 6, max: 20 });
const codeValidator = body("code").exists().isString();

authRouter.post(
  "/login",
  loginOrEmailValidator,
  passwordValidator,
  inputValidationMiddleware,
  async (req: RequestWithBody<LoginBodyParams>, res) => {
    const body = matchedData<LoginBodyParams>(req);
    const user = await usersService.isLoginOrEmailAndPasswordCorrected(
      body.loginOrEmail,
      body.password,
    );

    if (user === null) {
      return res.status(401).send();
    }

    const [accessToken, refreshToken] = jwtService.createTokensPair(user.id);
    const refreshTokenExpTime = Number(appConfig.RT_TIME);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: refreshTokenExpTime,
    });
    return res.status(200).send({ accessToken });
  },
);

authRouter.post(
  "/logout",
  authorizationRefreshTokenMiddleware,
  inputValidationMiddleware,
  async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const userId = req.userId as string;
    const logoutSuccess = await refreshTokenBlackListService.addToken(
      userId,
      refreshToken,
    );

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

authRouter.post(
  "/refresh-token",
  authorizationRefreshTokenMiddleware,
  inputValidationMiddleware,
  async (req, res) => {
    // клиент отправляет на бек refreshToken в cookie,
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const userId = req.userId as string;
    // мы должны вернуть новую пару токенов (старый refreshToken протухает, т.е. отмечаем refreshToken как невалидный);
    const result = await refreshTokenBlackListService.updateTokens(
      userId,
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

// возвращаем короткую инфу о текущем пользователе на основе accessToken.
authRouter.get(
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

/**
 * Регистрирует пользователя в системе и отправляет ему confirmation code на email
 */
authRouter.post(
  "/registration",
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

authRouter.post(
  "/registration-confirmation",
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

authRouter.post(
  "/registration-email-resending",
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

// authRouter.post("/send", async (req: Request, res: Response) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.resend.com",
//     secure: true,
//     port: 465,
//     auth: {
//       user: "resend",
//       pass: appConfig.SEND_MAIL_API_KEY,
//     },
//   });

//   const info = await transporter.sendMail({
//     from: "onboarding@resend.dev",
//     to: "dmi3iva@gmail.com",
//     subject: "Hello Test",
//     html: "<strong>It works!</strong>",
//   });

//   console.log("Message sent: %s", info.messageId);

//   res.send({
//     email: req.body.email,
//     message: req.body.message,
//     subject: req.body.subject,
//   });
// });
