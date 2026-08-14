import { Router } from "express";
import { body, matchedData, param } from "express-validator";
import { IdParam } from "../../types/common.type";
import { CommentsService, ERemoveUserState } from "./comments.service";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { injectable, inject } from "inversify";
import { ELikeStatus, LIKE_VALUES } from "../likes/like.model";
import { ILikeStatusPutBody } from "./comments.types";
import { LikeService } from "../likes/like.service";
import { authorizationTokenWithoutRestriction } from "../../middleware/authorizationTokenWihtoutRestriction.middleware";

@injectable()
export class CommentsController {
  router = Router();
  constructor(
    @inject(CommentsService) private commentsService: CommentsService,
    @inject(LikeService) private likeService: LikeService,
  ) {
    this.registerGet();
    this.registerDeleteById();
    this.registerPutById();
    this.registerLikeUpdates();
  }

  getRouter() {
    return this.router;
  }

  registerGet() {
    this.router.get(
      "/:id",
      param("id").notEmpty().isString(),
      inputValidationMiddleware,
      authorizationTokenWithoutRestriction,
      async (req, res) => {
        const { id } = matchedData<IdParam>(req);
        const comment = await this.commentsService.getCommentById(
          id,
          req?.userId,
        );
        if (!comment) {
          return res.status(404).send("comment not found");
        }

        return res.status(200).send(comment);
      },
    );
  }

  registerDeleteById() {
    this.router.delete(
      "/:id",
      authorizationTokenMiddleware,
      param("id").notEmpty().isString(),
      inputValidationMiddleware,
      async (req, res) => {
        const { id } = matchedData<IdParam>(req);
        const userId = req.userId;

        if (!userId) return res.status(401).send();

        const result = await this.commentsService.removeById(id, userId);
        if (result === ERemoveUserState.NOT_ALLOWED) {
          return res.status(403).send();
        }

        if (result === ERemoveUserState.FAILED) {
          return res.status(404).send();
        }

        return res.status(204).send();
      },
    );
  }

  registerPutById() {
    this.router.put(
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

        const result = await this.commentsService.updateComment({
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
  }

  registerLikeUpdates() {
    this.router.put(
      "/:commentId/like-status",
      authorizationTokenMiddleware,
      param("commentId").notEmpty().isString(),
      body("likeStatus").notEmpty().isIn(LIKE_VALUES),
      inputValidationMiddleware,
      async (req, res) => {
        const likeBody = matchedData<ILikeStatusPutBody>(req);
        const isCommentExist = await this.likeService.isCommentExist(
          likeBody.commentId,
        );
        const userId = req.userId;

        if (!isCommentExist) {
          return res
            .status(404)
            .send("comment with specified id doesn't exists or ");
        }
        if (!userId) {
          return res.status(401).send("not authorized");
        }

        await this.likeService.updateLike({ ...likeBody, userId });

        return res.status(204).send();
      },
    );
  }
}
