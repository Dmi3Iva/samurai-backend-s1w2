import { Router } from "express";
import type { Response } from "express";
import type { CreateBlogModel, ViewBlog } from "./models";
import type {
  RequestWithBody,
  RequestWithParams,
  RequestWithQuery,
} from "../../types/request.type";
import {
  blogsRepository,
  type IFindBlogsSearchTerm,
} from "../repository/blogs.repository";

interface BlogParams {
  id: string;
}

export const blogsRouter = Router();

blogsRouter.get(
  "/",
  (req: RequestWithQuery<IFindBlogsSearchTerm>, res: Response) => {
    const blogs = blogsRepository.findBlogs(req.body);
    res.send(blogs);
  },
);

blogsRouter.get("/:id", (req: RequestWithParams<BlogParams>, res: Response) => {
  const blog = blogsRepository.findBlog(req.body.id);

  if (!blog) {
    res.status(404).json({ message: "Blog not found" });
    return;
  }

  res.status(200).json(blog);
});

blogsRouter.post(
  "/",
  (req: RequestWithBody<CreateBlogModel>, res: Response) => {
    const { name, description, websiteUrl } = req.body;

    if (!name || !description || !websiteUrl) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newBlog = blogsRepository.createBlog(req.body);

    res.status(201).json(newBlog);
  },
);

blogsRouter.delete(
  "/:id",
  (req: RequestWithParams<BlogParams>, res: Response) => {
    if (blogsRepository.deleteBlog(req.params.id)) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  },
);
