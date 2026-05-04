import { matchedData, query } from "express-validator";
import { authorizationMiddleware } from "../../../middleware/authorization.middleware";
import { RequestWithQuery } from "../../../types/request.type";
import { usersRouter } from "../users.router";
import { usersRepository } from "../users.repository";
import { IUsersGetQueries } from "../models/users.model";

usersRouter.get(
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
  },
);
