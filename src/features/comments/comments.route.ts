import { Router } from "express";
import { body, matchedData, param } from "express-validator";
import { IdParam } from "../../types/common.type";
import { commentsService, ERemoveUserState } from "./comments.service";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";

export const commentsRouter = Router();

commentsRouter.get(
  "/:id",
  param("id").notEmpty().isString(),
  inputValidationMiddleware,
  async (req, res) => {
    const { id } = matchedData<IdParam>(req);
    const comment = await commentsService.getCommentById(id);
    if (!comment) {
      return res.status(404).send("comment not found");
    }

    return res.status(200).send(comment);
  },
);

commentsRouter.delete(
  "/:id",
  authorizationTokenMiddleware,
  param("id").notEmpty().isString(),
  inputValidationMiddleware,
  async (req, res) => {
    const { id } = matchedData<IdParam>(req);
    const userId = req.userId;

    if (!userId) return res.status(401).send();

    const result = await commentsService.removeById(id, userId);
    if (result === ERemoveUserState.NOT_ALLOWED) {
      return res.status(403).send();
    }

    if (result === ERemoveUserState.FAILED) {
      return res.status(404).send();
    }

    return res.status(204).send();
  },
);

commentsRouter.put(
  "/:id",
  authorizationTokenMiddleware,
  param("id").notEmpty().isString(),
  body("content").notEmpty().isString().isLength({ max: 300, min: 20 }),
  inputValidationMiddleware,
  async (req, res) => {
    const { id: commentId, content } = matchedData<
      IdParam & { content: string }
    >(req);
    const userId = req.userId;

    if (!userId) return res.status(401);

    const result = await commentsService.updateComment({
      commentId,
      content,
      userId,
    });

    if (result === ERemoveUserState.NOT_ALLOWED) {
      return res.status(403).send();
    }

    if (result === ERemoveUserState.FAILED) {
      return res.status(404).send();
    }

    return res.status(204).send();
  },
);
