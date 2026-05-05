import { RequestHandler, Router } from "express";
import {
  body,
  FieldValidationError,
  matchedData,
  validationResult,
} from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { usersService } from "../users/users.service";

export const authRouter = Router();

interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

const loginOrEmailValidator = body("loginOrEmail").exists().isString();
const passwordValidator = body("password").exists().isString();

authRouter.post(
  "/login",
  authorizationMiddleware,
  loginOrEmailValidator,
  passwordValidator,
  inputValidationMiddleware,
  async (req, res) => {
    const body = matchedData<LoginBodyParams>(req);
    const loginAndPasswordCorrected =
      await usersService.isLoginOrEmailAndPasswordCorrected(
        body.loginOrEmail,
        body.password,
      );

    if (loginAndPasswordCorrected) return res.status(204).send();

    return res.status(401).send();
  },
);
