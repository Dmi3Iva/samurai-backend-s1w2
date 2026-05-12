import { Router } from "express";
import { body, matchedData } from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { usersService } from "../users/users.service";
import jwt from "jsonwebtoken";

export const authRouter = Router();

interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

const loginOrEmailValidator = body("loginOrEmail").exists().isString();
const passwordValidator = body("password").exists().isString();

// TODO:: return access token
authRouter.post(
  "/login",
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

    const jwtToken = jwt.sign({id:}, process.env.envJWT_SECRET);

    if (loginAndPasswordCorrected) return res.status(204).send();

    return res.status(401).send();
  },
);
// TODO::
// GET /hometask_06/api/auth/me
