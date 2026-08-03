import { RequestHandler, Router } from "express";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { body, matchedData, param, query } from "express-validator";
import { UsersService, usersService } from "./users.service";
import { RequestWithBody, RequestWithQuery } from "../../types/request.type";
import { IUsersGetQueries, IUsersPostBody } from "./models/users.model";
import { usersRepository } from "./users.repository";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { ErrorResponseBody } from "../../types/response.type";

export class UsersController {
  private usersRouter: Router = Router();

  constructor(private usersService: UsersService) {
    this.registerDeleteHandler();
    this.registerGetHandler();
    this.registerPostHandler();
  }

  getRouter() {
    return this.usersRouter;
  }

  registerDeleteHandler = () => {
    this.usersRouter.delete(
      "/:id",
      authorizationMiddleware,
      param("id").isString(),
      async (req, res) => {
        const { id } = matchedData<{ id: string }>(req);

        const result = await usersService.removeUserById(id);
        if (result) {
          return res.status(204).send();
        }
        return res.status(404).send();
      },
    );
  };

  registerGetHandler = () => {
    this.usersRouter.get(
      "/",
      authorizationMiddleware,
      query("sortBy"),
      query("sortDirection"),
      query("pageNumber"),
      query("pageSize"),
      query("searchLoginTerm"),
      query("searchEmailTerm"),
      async (req: RequestWithQuery<IUsersGetQueries>, res) => {
        const queries = matchedData<IUsersGetQueries>(req);

        const result = await usersRepository.getUsersWithQuery(queries);

        return res.status(200).send(result);
      },
    );
  };

  registerPostHandler = () => {
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

    this.usersRouter.post(
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
}
