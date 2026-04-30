import { Router } from "express";
import type { NextFunction, RequestHandler, Response } from "express";
import type {
  CreateBlogModel,
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
  BlogsRouterResponse,
  IFindPostsByBlogSearchTerm,
} from "./models/blog.model";
import type {
  RequestWithBody,
  RequestWithQuery,
} from "../../types/request.type";
import { blogsService } from "./services/blogs.service";
import {
  body,
  matchedData,
  param,
  validationResult,
  type FieldValidationError,
} from "express-validator";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { BlogIdParam, IdParam } from "../../types/common.type";
import type { IPostCreateModel } from "../posts/models/post.model";

export const blogsRouter = Router();

const nameValidation = body("name")
  .exists()
  .withMessage("name is required field")
  .isString()
  .withMessage("name should be a string")
  .trim()
  .notEmpty()
  .withMessage("name is empty")
  .isLength({ max: 15 })
  .withMessage("name length should be from 0 to 15");

const descriptionValidation = body("description")
  .exists()
  .withMessage("description is required field")
  .isString()
  .withMessage("description should be a string")
  .trim()
  .notEmpty()
  .withMessage("description is empty")
  .isLength({ max: 500 })
  .withMessage("description should be a string max length 500");

const websiteUrlValidationRegex =
  /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
const websiteUrlValidation = body("websiteUrl")
  .exists()
  .withMessage("websiteUrl is required field")
  .isString()
  .withMessage("websiteUrl should be a string")
  .trim()
  .notEmpty()
  .withMessage("webstireUrl is empty")
  .isLength({ max: 100 })
  .withMessage("websiteUrl max length is 100")
  .matches(websiteUrlValidationRegex)
  .withMessage(
    `websiterUrl should match regex ${websiteUrlValidationRegex.toString()}`,
  );

const postTitleValidation = body("title")
  .exists()
  .withMessage("title is required field")
  .isString()
  .withMessage("title should be a string")
  .trim()
  .notEmpty()
  .withMessage("title is empty")
  .isLength({ max: 30 })
  .withMessage("title length should be from 0 to 30");

const postShortDescriptionValidation = body("shortDescription")
  .exists()
  .withMessage("shortDescription is required field")
  .isString()
  .withMessage("shortDescription should be a string")
  .trim()
  .notEmpty()
  .withMessage("shortDescription is empty")
  .isLength({ max: 100 })
  .withMessage("shortDescription should be a string max length 100");

const postContentValidation = body("content")
  .exists()
  .withMessage("content is required field")
  .isString()
  .withMessage("content should be a string")
  .trim()
  .notEmpty()
  .withMessage("content is empty")
  .isLength({ max: 100 })
  .withMessage("content should be a string max length 100");

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

blogsRouter.get(
  "/",
  async (
    req: RequestWithQuery<IFindBlogsSearchTerm>,
    res: Response<BlogsRouterResponse>,
  ) => {
    const blogs = await blogsService.findBlogs(req.query);
    res.send(blogs);
  },
);

blogsRouter.post(
  "/",
  authorizationMiddleware,
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
  inputValidationMiddleware,
  async (req: RequestWithBody<CreateBlogModel>, res: Response) => {
    const data = matchedData<CreateBlogModel>(req);
    const newBlog = await blogsService.createBlog(data);

    res.status(201).json(newBlog);
  },
);

blogsRouter.get(
  "/:id",
  inputValidationMiddleware,
  param("id"),
  async (req, res) => {
    const data = matchedData<IdParam>(req);
    const blog = await blogsService.findBlog(data.id);

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    res.status(200).json(blog);
  },
);

blogsRouter.get(
  "/:id/posts",
  inputValidationMiddleware,
  param("id"),
  async (req: RequestWithQuery<Partial<IFindPostsByBlogSearchTerm>>, res) => {
    const { id: blogId } = matchedData<IdParam>(req);
    const query = req.query;
    const posts = await blogsService.findPostsByBlogId(blogId, query);

    if (!posts) {
      res
        .status(404)
        .json({ message: `Specified blog ${blogId} doesn't exist` });
      return;
    }

    res.status(200).json(posts);
  },
);

blogsRouter.post(
  "/:blogId/posts",
  authorizationMiddleware,
  param("blogId"),
  postTitleValidation,
  postShortDescriptionValidation,
  postContentValidation,
  inputValidationMiddleware,
  async (req, res) => {
    const data = matchedData<CreateBlogModel & BlogIdParam>(req);

    const newPost = await blogsService.createPostForBlog(data);
    if (!newPost) {
      return res.status(404).json({ message: `Blog ${data.blogId} not found` });
    }

    res.status(201).json(newPost);
  },
);

blogsRouter.put(
  "/:id",
  authorizationMiddleware,
  param("id"),
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
  inputValidationMiddleware,
  async (req, res) => {
    const data = matchedData<UpdateBlogModel & IdParam>(req);

    const isBlogUpdated = await blogsService.updateBlog({
      id: data.id,
      updateBlogModelData: {
        name: data.name,
        description: data.description,
        websiteUrl: data.websiteUrl,
      },
    });

    if (!isBlogUpdated) {
      return res.status(404).json(`Not found blog with id ${data.id}`);
    }

    res.sendStatus(204);
  },
);

blogsRouter.delete(
  "/:id",
  authorizationMiddleware,
  param("id"),
  inputValidationMiddleware,
  async (req, res) => {
    const data = matchedData<IdParam>(req);
    const isRemoved = await blogsService.deleteBlog(data.id);

    if (!isRemoved) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(204).send();
  },
);
