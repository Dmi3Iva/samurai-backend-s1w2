import { body, matchedData } from "express-validator";
import { RequestWithBody } from "../../../types/request.type";
import { RequestHandler, Router } from "express";
import { inputValidationMiddleware } from "../../../middleware/inputValidation.middleware";
import { authorizationMiddleware } from "../../../middleware/authorization.middleware";
import { usersService } from "../users.service";
import { ErrorResponseBody } from "../../../types/response.type";
import { IUsersPostBody } from "../models/users.model";

export const registerPostHandler = (r: Router) => {
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
      return next();
    }

    const errorResponse: ErrorResponseBody = {
      errorsMessages: [
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
      return next();
    }

    const errorResponse: ErrorResponseBody = {
      errorsMessages: [
        {
          field: "email",
          message: "email is not unique, please write another one",
        },
      ],
    };

    res.status(400).send(errorResponse);
  };

  r.post(
    "/",
    authorizationMiddleware,
    body("login")
      .exists()
      .withMessage("field login is required")
      .isString()
      .withMessage("field login should be a string")
      .isLength({ min: 3, max: 10 })
      .withMessage("field login should has length from 3 to 10")
      .matches(/^[a-zA-Z0-9_-]*$/)
      .withMessage("field login should match ^[a-zA-Z0-9_-]*$"),
    body("password").exists().isString().isLength({ min: 6, max: 20 }),
    body("email")
      .exists()
      .isString()
      .isEmail({
        host_blacklist: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/],
      })
      .withMessage(
        "field email, should match /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/",
      ),
    inputValidationMiddleware,
    loginIsUniqueValidator,
    emailIsUniqueValidator,
    async (req: RequestWithBody<IUsersPostBody>, res) => {
      const data = matchedData<IUsersPostBody>(req);
      const user = await usersService.createUser(data);
      if (!user) {
        const errorResponse: ErrorResponseBody = {
          errorsMessages: [
            {
              field: "",
              message: "something went wrong when created a user, try again",
            },
          ],
        };
        return res.status(500).send(errorResponse);
      }

      return res.status(201).json(user);
    },
  );
};
