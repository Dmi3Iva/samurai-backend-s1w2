import { Router } from "express";
import type { RequestHandler, Response, Request } from "express";
import type {
  IPostUpadteModel,
  IPostCreateModel,
  IPostView as IPostView,
  IPostType,
} from "./models/post.model";
import type { RequestWithBody } from "../../types/request.type";
import {
  body,
  matchedData,
  param,
  validationResult,
  type FieldValidationError,
} from "express-validator";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { blogsRepository } from "../blogs/repository/blogs.repository";
import { postsService } from "./services/posts.service";

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

const inputValidationMiddleware: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorsMessages = errors
    .array({
      onlyFirstError: true,
    })
    .map((e) => ({ message: e.msg, field: (e as FieldValidationError).path }));

  res.status(400).send({
    errorsMessages,
  });
};

postsRouter.get("/", async (req: Request, res: Response<IPostView[]>) => {
  const posts = await postsService.getPosts();
  res.send(posts);
});

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
