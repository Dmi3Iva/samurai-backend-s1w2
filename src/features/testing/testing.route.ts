import { Router } from "express";
import { blogsRepository } from "../blogs/blogs.repository";
import { postsRepository } from "../posts/repository/posts.repository";
import { usersRepository } from "../users/users.repository";
import { commentsRepository } from "../comments/comments.repository";
import { refreshTokenBlackListRepository } from "../refreshTokenBlacklist/refreshTokenBlackList.repository";

export const testingRouter = Router();

testingRouter.delete("/", async (req, res) => {
  await blogsRepository.removeAll();
  await postsRepository.removeAll();
  await usersRepository.removeAll();
  await commentsRepository.removeAll();
  await refreshTokenBlackListRepository.removeAll();

  res.status(204).send();
});
