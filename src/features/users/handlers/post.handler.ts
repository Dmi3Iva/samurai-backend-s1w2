import { body, matchedData } from "express-validator";
import { RequestWithBody } from "../../../types/request.type";
import { usersRouter } from "../users.router";
import { RequestHandler } from "express";
import { inputValidationMiddleware } from "../../../middleware/inputValidation.middleware";
import { authorizationMiddleware } from "../../../middleware/authorization.middleware";
import { usersService } from "../users.service";
import { ErrorResponseBody } from "../../../types/response.type";
import { ErrorMessage } from "express-validator/lib/base";
import { IUsersPostBody } from "../models/users.model";

/**
 * Note: If the error should be in the BLL, for example,
 * "the email address is not unique",
 * do not try to mix this error with input validation errors in the middleware, just return one element in the errors array
 */
const loginIsUniqueValidator: RequestHandler = async (
  req: RequestWithBody<IUsersPostBody>,
  res,
  next,
) => {
  if (await usersService.isUniqueLogin(req.body.login)) {
    next();
  }

  const errorResponse: ErrorResponseBody = {
    errorMessages: [
      {
        field: "login",
        message: "Login is not unique, please write another one",
      },
    ],
  };

  res.status(400).send(errorResponse);
};

const emailIsUniqueValidator: RequestHandler = async (req, res, next) => {
  if (await usersService.isUniqueEmail(req.body.email)) {
    next();
  }

  const errorResponse: ErrorResponseBody = {
    errorMessages: [
      {
        field: "email",
        message: "email is not unique, please write another one",
      },
    ],
  };

  res.status(400).send(errorResponse);
};

// TODO:: check errors with params
usersRouter.post(
  "/",
  authorizationMiddleware,
  body("login")
    .exists()
    .isString()
    .isLength({ min: 3, max: 10 })
    .matches(/^[a-zA-Z0-9_-]*$/),
  body("password").exists().isString().isLength({ min: 6, max: 20 }),
  body("email")
    .exists()
    .isString()
    .isEmail({
      host_whitelist: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/],
    }),
  inputValidationMiddleware,
  loginIsUniqueValidator,
  emailIsUniqueValidator,
  (req: RequestWithBody<IUsersPostBody>, res) => {
    const data = matchedData<IUsersPostBody>(req);
    const user = usersService.createUser(data);
    if (!user) {
      const errorResponse: ErrorResponseBody = {
        errorMessages: [
          {
            field: "",
            message: "something went wrong when created a user, try again",
          },
        ],
      };
      return res.status(500).send(errorResponse);
    }

    return res.status(201).send(user);
  },
);
