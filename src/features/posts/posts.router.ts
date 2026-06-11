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
import { postsService } from "./services/posts.service";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { IFindCommentsSearchTerm } from "../comments/comments.models";
import { authorizationTokenMiddleware } from "../../middleware/authorizationToken.middleware";
import { postsRepository } from "./repository/posts.repository";
import { commentsService } from "../comments/comments.service";

interface PostsIdParam {
  id: string;
}

export const postsRouter = Router();

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

postsRouter.get(
  "/",
  async (
    req: RequestWithQuery<IFindPostsSearchTerm>,
    res: Response<GetPostsResponse>,
  ) => {
    const posts = await postsService.getPosts(req.query);
    res.send(posts);
  },
);

postsRouter.post(
  "/",
  authorizationMiddleware,
  titleValidation,
  shortDescriptionValidation,
  contentValidation,
  blogIdValidation,
  inputValidationMiddleware,
  async (req: RequestWithBody<IPostCreateModel>, res: Response) => {
    const data = matchedData<IPostCreateModel>(req);

    const createdPost = await postsService.createPost(data);

    if (!createdPost) {
      return res.status(404).json(`Not found blog with id ${data.blogId}`);
    }
    res.status(201).json(createdPost);
  },
);

postsRouter.get(
  "/:id",
  param("id"),
  inputValidationMiddleware,
  async (req, res) => {
    const data = matchedData<PostsIdParam>(req);
    const post = await postsService.getPost(data.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  },
);

postsRouter.put(
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

    const updatedPostResult = await postsService.updatePost({
      id: data.id,
      data: data,
    });

    if (!updatedPostResult) {
      return res.status(404).json(`Not found blog with id  ${data.id}`);
    }

    res.sendStatus(204);
  },
);

postsRouter.delete(
  "/:id",
  authorizationMiddleware,
  param("id"),
  inputValidationMiddleware,
  async (req, res) => {
    const data = matchedData<PostsIdParam>(req);
    const isRemoved = await postsService.deletePost(data.id);

    if (!isRemoved) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(204).send();
  },
);

// POST /posts/{postId}/comments
postsRouter.post(
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
    const post = await postsService.getPost(postId);

    if (!userId) {
      return res.status(401).send();
    }
    if (!post) {
      return res.status(404).send();
    }

    const createdComment = await commentsService.createComment({
      postId,
      content,
      userId,
    });

    return res.status(201).send(createdComment);
  },
);

// GET /posts/{postId}/comments
postsRouter.get(
  "/:postId/comments",
  param("postId").notEmpty().isString(),
  async (req: RequestWithQuery<IFindCommentsSearchTerm>, res: Response) => {
    const { postId } = matchedData<{ postId: string }>(req);
    const comments = await commentsService.getComments(postId, req.query);
    if (!comments) return res.status(404).send();

    return res.status(200).send(comments);
  },
);
