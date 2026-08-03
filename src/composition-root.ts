import { AuthRepository } from "./features/auth/auth.repository";
import { AuthController } from "./features/auth/auth.router";
import { AuthService } from "./features/auth/auth.service";
import { BlogsRepository } from "./features/blogs/blogs.repository";
import { BlogsController } from "./features/blogs/blogs.router";
import { BlogsService } from "./features/blogs/blogs.service";
import { CommentsRepository } from "./features/comments/comments.repository";
import { CommentsController } from "./features/comments/comments.route";
import { CommentsService } from "./features/comments/comments.service";
import { PostsController } from "./features/posts/posts.router";
import { PostsRepository } from "./features/posts/repository/posts.repository";
import { PostsService } from "./features/posts/services/posts.service";
import { RateLimitService } from "./features/rate-limit/rate-limit.service";
import { RateLimitReadRepository } from "./features/rate-limit/repository/rate-limit-read.repository";
import { RateLimitUpdateRepository } from "./features/rate-limit/repository/rate-limit-update.repository";
import { SecurityDeviceController } from "./features/security-devices/security-devices.router";
import { TestingController } from "./features/testing/testing.route";
import { UsersRepository } from "./features/users/users.repository";
import { UsersController } from "./features/users/users.router";
import { UsersService } from "./features/users/users.service";

const rateLimitUpdateRepository = new RateLimitUpdateRepository();
const rateLimitReadRepository = new RateLimitReadRepository();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
export const authController = new AuthController(authService);

const blogsRepository = new BlogsRepository();
const postsRepository = new PostsRepository(blogsRepository);
const postsService = new PostsService(postsRepository, blogsRepository);

const commentsRepository = new CommentsRepository();
const commentsService = new CommentsService(commentsRepository, postsService);
export const commentsController = new CommentsController(commentsService);

const blogsService = new BlogsService(blogsRepository, postsRepository);
export const blogsController = new BlogsController(blogsService);

export const postsController = new PostsController(
  postsService,
  commentsService,
);

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);
export const usersController = new UsersController(usersService);

export const securityDeviceController = new SecurityDeviceController(
  authService,
);

export const testingController = new TestingController(
  blogsRepository,
  postsRepository,
  usersRepository,
  commentsRepository,
  authRepository,
  rateLimitUpdateRepository,
);

export const rateLimitService = new RateLimitService(
  rateLimitReadRepository,
  rateLimitUpdateRepository,
);
