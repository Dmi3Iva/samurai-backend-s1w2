import { Router } from "express";
import type { RequestHandler, Response } from "express";
import type {
  CreateBlogModel,
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
} from "./models/blog.model";
import type {
  RequestWithBody,
  RequestWithQuery,
} from "../../types/request.type";
import { blogsRepository } from "./repository/blogs.repository";
import {
  body,
  matchedData,
  param,
  validationResult,
  type FieldValidationError,
} from "express-validator";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";

interface BlogIdParam {
  id: string;
}

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
    res: Response<IViewBlog[]>,
  ) => {
    const blogs = await blogsRepository.findBlogs(req.query);
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
    const newBlog = await blogsRepository.createBlog(data);

    res.status(201).json(newBlog);
  },
);

blogsRouter.get(
  "/:id",
  inputValidationMiddleware,
  param("id"),
  async (req, res) => {
    const data = matchedData<BlogIdParam>(req);
    const blog = await blogsRepository.findBlog(data.id);

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    res.status(200).json(blog);
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
    const data = matchedData<UpdateBlogModel & BlogIdParam>(req);

    const isBlogUpdated = await blogsRepository.updateBlog({
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
    const data = matchedData<BlogIdParam>(req);
    const isRemoved = await blogsRepository.deleteBlog(data.id);

    if (!isRemoved) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(204).send();
  },
);
