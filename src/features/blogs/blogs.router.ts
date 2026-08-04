import { Router } from "express";
import type { Response } from "express";
import type {
  CreateBlogModel,
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  BlogsRouterResponse,
  IFindPostsByBlogSearchTerm,
} from "./blog.model";
import type {
  RequestWithBody,
  RequestWithQuery,
} from "../../types/request.type";
import { BlogsService } from "./blogs.service";
import { body, matchedData, param } from "express-validator";
import { authorizationMiddleware } from "../../middleware/authorization.middleware";
import { BlogIdParam, IdParam } from "../../types/common.type";
import { inputValidationMiddleware } from "../../middleware/inputValidation.middleware";
import { inject, injectable } from "inversify";

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

@injectable()
export class BlogsController {
  router: Router = Router();
  constructor(
    @inject(BlogsService)
    private blogsService: BlogsService,
  ) {
    this.registerGet();
    this.registerPost();
    this.registerGetById();
    this.registerGetPostsById();
    this.registerPostByBlogId();
    this.registerPutById();
    this.registerDelete();
  }

  getRouter() {
    return this.router;
  }

  registerGet() {
    this.router.get(
      "/",
      async (
        req: RequestWithQuery<IFindBlogsSearchTerm>,
        res: Response<BlogsRouterResponse>,
      ) => {
        const blogs = await this.blogsService.findBlogs(req.query);
        res.send(blogs);
      },
    );
  }

  registerPost() {
    this.router.post(
      "/",
      authorizationMiddleware,
      nameValidation,
      descriptionValidation,
      websiteUrlValidation,
      inputValidationMiddleware,
      async (req: RequestWithBody<CreateBlogModel>, res: Response) => {
        const data = matchedData<CreateBlogModel>(req);
        const newBlog = await this.blogsService.createBlog(data);

        res.status(201).json(newBlog);
      },
    );
  }

  registerGetById() {
    this.router.get(
      "/:id",
      inputValidationMiddleware,
      param("id"),
      async (req, res) => {
        const data = matchedData<IdParam>(req);
        const blog = await this.blogsService.findBlog(data.id);

        if (!blog) {
          res.status(404).json({ message: "Blog not found" });
          return;
        }

        res.status(200).json(blog);
      },
    );
  }

  registerGetPostsById() {
    this.router.get(
      "/:id/posts",
      inputValidationMiddleware,
      param("id"),
      async (
        req: RequestWithQuery<Partial<IFindPostsByBlogSearchTerm>>,
        res,
      ) => {
        const { id: blogId } = matchedData<IdParam>(req);
        const query = req.query;
        const posts = await this.blogsService.findPostsByBlogId(blogId, query);

        if (!posts) {
          res
            .status(404)
            .json({ message: `Specified blog ${blogId} doesn't exist` });
          return;
        }

        res.status(200).json(posts);
      },
    );
  }

  registerPostByBlogId() {
    this.router.post(
      "/:blogId/posts",
      authorizationMiddleware,
      param("blogId"),
      postTitleValidation,
      postShortDescriptionValidation,
      postContentValidation,
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<CreateBlogModel & BlogIdParam>(req);

        const newPost = await this.blogsService.createPost(data);
        if (!newPost) {
          return res
            .status(404)
            .json({ message: `Blog ${data.blogId} not found` });
        }

        res.status(201).json(newPost);
      },
    );
  }

  registerPutById() {
    this.router.put(
      "/:id",
      authorizationMiddleware,
      param("id"),
      nameValidation,
      descriptionValidation,
      websiteUrlValidation,
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<UpdateBlogModel & IdParam>(req);

        const isBlogUpdated = await this.blogsService.updateBlog({
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
  }

  registerDelete() {
    this.router.delete(
      "/:id",
      authorizationMiddleware,
      param("id"),
      inputValidationMiddleware,
      async (req, res) => {
        const data = matchedData<IdParam>(req);
        const isRemoved = await this.blogsService.deleteBlog(data.id);

        if (!isRemoved) {
          return res.status(404).json({ message: "Blog not found" });
        }

        return res.status(204).send();
      },
    );
  }
}
