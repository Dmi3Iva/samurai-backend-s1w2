import { Router, Request } from "express";
import { body, matchedData } from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { usersService } from "../users/users.service";
import { RequestWithBody } from "../../types/request.type";
import { jwtService } from "../../auth/adapters/jwt.service";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";

export const authRouter = Router();

interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

interface AuthMeParams {
  email: string;
  login: string;
  userId: string;
}

const loginOrEmailValidator = body("loginOrEmail").exists().isString();
const passwordValidator = body("password").exists().isString();

const isString = (value: unknown) => {
  return value && typeof value === "string";
};

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

    const accessToken = jwtService.createToken(user.id);

    return res.status(200).send({ accessToken });
  },
);

authRouter.get(
  "/me",
  authorizationTokenMiddleware,
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
