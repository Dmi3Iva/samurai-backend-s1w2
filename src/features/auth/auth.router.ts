import { RequestHandler, Router } from "express";
import {
  body,
  FieldValidationError,
  matchedData,
  validationResult,
} from "express-validator";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";

export const authRouter = Router();

interface LoginBodyParams {
  loginOrEmail: string;
  password: string;
}

const loginOrEmailValidator = body("loginOrEmail").exists().isString();
const passwordValidator = body("password").exists().isString();

authRouter.post(
  "/login",
  loginOrEmailValidator,
  passwordValidator,
  inputValidationMiddleware,
  (req, res) => {
    const body = matchedData<LoginBodyParams>(req);
    // TODO:: finish
  },
);
