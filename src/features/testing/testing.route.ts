import { Router } from "express";
import { blogsRepository } from "../blogs/repository/blogs.repository";
import { postsRepository } from "../posts/repository/posts.repository";
import { usersRepository } from "../users/users.repository";

export const testingRouter = Router();

testingRouter.delete("/", async (req, res) => {
  await blogsRepository.removeAll();
  await postsRepository.removeAll();
  await usersRepository.removeAll();
  res.status(204).send();
});
