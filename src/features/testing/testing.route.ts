import { Router } from "express";
import { BlogsRepository } from "../blogs/blogs.repository";
import { PostsRepository } from "../posts/repository/posts.repository";
import { UsersRepository } from "../users/users.repository";
import { CommentsRepository } from "../comments/comments.repository";
import { AuthRepository } from "../auth/auth.repository";
import { RateLimitUpdateRepository } from "../rate-limit/repository/rate-limit-update.repository";

export class TestingController {
  router = Router();
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
    private authRepository: AuthRepository,
    private rateLimitUpdateRepository: RateLimitUpdateRepository,
  ) {
    this.registerDelete();
  }

  getRouter() {
    return this.router;
  }

  registerDelete() {
    this.router.delete("/", async (req, res) => {
      await this.blogsRepository.removeAll();
      await this.postsRepository.removeAll();
      await this.usersRepository.removeAll();
      await this.commentsRepository.removeAll();
      await this.authRepository.removeAll();
      await this.rateLimitUpdateRepository.removeAll();

      res.status(204).send();
    });
  }
}
