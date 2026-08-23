import { Router } from "express";
import type { Response } from "express";
import type {
  IPostUpadteModel,
  IPostCreateModel,
  GetPostsResponse,
  IFindPostsSearchTerm,
} from "./models/post.model";
import type {
  RequestWithBody,
  RequestWithQuery,
} from "../../types/request.type";
import { body, matchedData, param } from "express-validator";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { PostsService } from "./services/posts.service";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { IFindCommentsSearchTerm } from "../comments/comments.types";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { CommentsService } from "../comments/comments.service";
import { inject, injectable } from "inversify";
import { authorizationTokenWithoutRestriction } from "../../middleware/authorizationTokenWihtoutRestriction.middleware";
import { PostLikeService } from "../post-likes/post-like.service";
import { POST_LIKE_VALUES } from "../post-likes/post-like.model";
import { IPostLikeStatusDTO } from "../post-likes/post-like.types";

interface PostsIdParam {
  id: string;
}

const titleValidation = body("title")
  .exists()
  .withMessage("title is required field")
  .isString()
  .withMessage("title should be a string")
  .trim()
  .notEmpty()
  .withMessage("title is empty")
  .isLength({ max: 30 })
  .withMessage("title length should be from 0 to 30");

const shortDescriptionValidation = body("shortDescription")
  .exists()
  .withMessage("shortDescription is required field")
  .isString()
  .withMessage("shortDescription should be a string")
  .trim()
  .notEmpty()
  .withMessage("shortDescription is empty")
  .isLength({ max: 100 })
  .withMessage("shortDescription should be a string max length 100");

const contentValidation = body("content")
  .exists()
  .withMessage("content is required field")
  .isString()
  .withMessage("content should be a string")
  .trim()
  .notEmpty()
  .withMessage("content is empty")
  .isLength({ max: 100 })
  .withMessage("content should be a string max length 100");

const blogIdValidation = body("blogId")
  .exists()
  .withMessage("blogId is required field")
  .isString()
  .withMessage("blogId should be a string");

@injectable()
export class PostsController {
  router = Router();
  constructor(
    @inject(PostsService)
    private postsService: PostsService,
    @inject(CommentsService)
    private commentsService: CommentsService,
    @inject(PostLikeService)
    private postLikeService: PostLikeService,
  ) {
    this.registerGet();
    this.registerPost();
    this.registerGetById();
    this.registerPut();
    this.registerDeleteById();
    this.registerPostCommentById();
    this.registerGetCommentById();
    this.registerLikeUpdates();
  }

  getRouter() {
    return this.router;
  }

  registerGet() {
    this.router.get(
      "/",
      authorizationTokenWithoutRestriction,
      async (
        req: RequestWithQuery<IFindPostsSearchTerm>,
        res: Response<GetPostsResponse>,
      ) => {
        const posts = await this.postsService.getPosts(
          req.query,
          req.userId ?? undefined,
        );
        res.send(posts);
      },
    );
  }

  registerPost() {
    this.router.post(
      "/",
      authorizationMiddleware,
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      blogIdValidation,
      authorizationTokenWithoutRestriction,
      inputValidationMiddleware,
      async (req: RequestWithBody<IPostCreateModel>, res: Response) => {
        const data = matchedData<IPostCreateModel>(req);

        const createdPost = await this.postsService.createPost(
          data,
          req.userId ?? undefined,
        );

        if (!createdPost) {
          return res.status(404).json(`Not found blog with id ${data.blogId}`);
        }
        res.status(201).json(createdPost);
      },
    );
  }

  registerGetById() {
    this.router.get(
      "/:id",
      param("id"),
      authorizationTokenWithoutRestriction,
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<PostsIdParam>(req);
        const post = await this.postsService.getPost(
          data.id,
          req?.userId ?? undefined,
        );

        if (!post) {
          res.status(404).json({ message: "Post not found" });
          return;
        }

        res.status(200).json(post);
      },
    );
  }

  registerPut() {
    this.router.put(
      "/:id",
      authorizationMiddleware,
      param("id"),
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      blogIdValidation,
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<IPostUpadteModel & PostsIdParam>(req);

        const updatedPostResult = await this.postsService.updatePost({
          id: data.id,
          data: data,
        });

        if (!updatedPostResult) {
          return res.status(404).json(`Not found blog with id  ${data.id}`);
        }

        res.sendStatus(204);
      },
    );
  }

  registerDeleteById() {
    this.router.delete(
      "/:id",
      authorizationMiddleware,
      param("id"),
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<PostsIdParam>(req);
        const isRemoved = await this.postsService.deletePost(data.id);

        if (!isRemoved) {
          return res.status(404).json({ message: "Blog not found" });
        }

        return res.status(204).send();
      },
    );
  }

  registerPostCommentById() {
    this.router.post(
      "/:postId/comments",
      authorizationTokenMiddleware,
      param("postId").notEmpty().isString(),
      body("content").notEmpty().isString().isLength({ min: 20, max: 300 }),
      inputValidationMiddleware,
      async (req: RequestWithQuery<IFindCommentsSearchTerm>, res: Response) => {
        const { postId, content } = matchedData<{
          postId: string;
          content: string;
        }>(req);
        const userId = req.userId;
        const post = await this.postsService.getPost(
          postId,
          req.userId ?? undefined,
        );

        if (!userId) {
          return res.status(401).send();
        }
        if (!post) {
          return res.status(404).send();
        }

        const createdComment = await this.commentsService.createComment({
          postId,
          content,
          userId,
        });

        return res.status(201).send(createdComment);
      },
    );
  }

  registerGetCommentById() {
    // TODO:: extendedLikesInfo
    this.router.get(
      "/:postId/comments",
      param("postId").notEmpty().isString(),
      authorizationTokenWithoutRestriction,
      async (req: RequestWithQuery<IFindCommentsSearchTerm>, res: Response) => {
        const { postId } = matchedData<{ postId: string }>(req);
        const comments = await this.commentsService.getComments(
          postId,
          req.query,
          req?.userId ?? undefined,
        );
        if (!comments) return res.status(404).send();

        return res.status(200).send(comments);
      },
    );
  }

  registerLikeUpdates() {
    this.router.put(
      "/:postId/like-status",
      authorizationTokenMiddleware,
      param("postId").notEmpty().isString(),
      body("likeStatus").notEmpty().isIn(POST_LIKE_VALUES),
      inputValidationMiddleware,
      async (req: RequestWithBody<IPostLikeStatusDTO>, res: Response) => {
        if (!req.userId) {
          return res.status(401).send("Unauthorized");
        }

        const { postId, likeStatus: postLikeStatus } =
          matchedData<IPostLikeStatusDTO>(req);
        const postExists = await this.postsService.getPost(postId, req.userId);

        if (!postExists) {
          return res
            .status(404)
            .send(`post with specified postId doesn't exists`);
        }

        await this.postLikeService.set({
          userId: req.userId,
          postId,
          postLikeStatus,
        });

        return res.status(204).send();
      },
    );
  }
}
