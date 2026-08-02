import { Router } from "express";
import { blogsRepository } from "../blogs/blogs.repository";
import { postsRepository } from "../posts/repository/posts.repository";
import { usersRepository } from "../users/users.repository";
import { commentsRepository } from "../comments/comments.repository";
import { authRepository } from "../auth/auth.repository";
import { rateLimitUpdateRepository } from "../rate-limit/repository/rate-limit-update.repository";

export class TestingController {
  router = Router();
  constructor() {
    this.registerDelete();
  }

  getRouter() {
    return this.router;
  }

  registerDelete() {
    this.router.delete("/", async (req, res) => {
      await blogsRepository.removeAll();
      await postsRepository.removeAll();
      await usersRepository.removeAll();
      await commentsRepository.removeAll();
      await authRepository.removeAll();
      await rateLimitUpdateRepository.removeAll();

      res.status(204).send();
    });
  }
}

export const testingController = new TestingController();
