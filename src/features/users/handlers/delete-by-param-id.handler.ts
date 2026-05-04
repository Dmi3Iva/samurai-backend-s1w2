import { matchedData, param } from "express-validator";
import { usersRouter } from "../users.router";
import { authorizationMiddleware } from "../../../middleware/authorization.middleware";
import { usersService } from "../users.service";

usersRouter.delete(
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
