import { Router } from "express";
import { blogsRepository } from "../blogs/repository/blogs.repository";
import { postsRepository } from "../posts/repository/posts.repository";

export const testingRouter = Router();

testingRouter.delete("/", (req, res) => {
  blogsRepository.removeAll();
  postsRepository.removeAll();
  res.status(204).send();
});
