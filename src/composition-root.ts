import { Container } from "inversify";
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
import { RateLimitReadRepository } from "./features/rate-limit/repository/rate-limit-read.repository";
import { RateLimitUpdateRepository } from "./features/rate-limit/repository/rate-limit-update.repository";
import { SecurityDeviceController } from "./features/security-devices/security-devices.router";
import { TestingController } from "./features/testing/testing.route";
import { UsersRepository } from "./features/users/users.repository";
import { UsersController } from "./features/users/users.router";
import { UsersService } from "./features/users/users.service";
import { RateLimitService } from "./features/rate-limit/rate-limit.service";
import { LikeService } from "./features/likes/like.service";
import { LikesRepository } from "./features/likes/likes.repository";
import { UsersReadRepository } from "./features/users/users-read.repository";

export const iocContainer = new Container();

iocContainer.bind(RateLimitReadRepository).toSelf();
iocContainer.bind(RateLimitUpdateRepository).toSelf();
iocContainer.bind(RateLimitService).toSelf();

iocContainer.bind(AuthController).toSelf();
iocContainer.bind(AuthService).toSelf();
iocContainer.bind(AuthRepository).toSelf();

iocContainer.bind(BlogsController).toSelf();
iocContainer.bind(BlogsService).toSelf();
iocContainer.bind(BlogsRepository).toSelf();

iocContainer.bind(PostsController).toSelf();
iocContainer.bind(PostsService).toSelf();
iocContainer.bind(PostsRepository).toSelf();

iocContainer.bind(CommentsRepository).toSelf();

iocContainer.bind(LikesRepository).toSelf();
iocContainer.bind(LikeService).toSelf();

iocContainer.bind(CommentsController).toSelf();
iocContainer.bind(CommentsService).toSelf();

iocContainer.bind(UsersController).toSelf();
iocContainer.bind(UsersService).toSelf();
iocContainer.bind(UsersRepository).toSelf();
iocContainer.bind(UsersReadRepository).toSelf();

iocContainer.bind(TestingController).toSelf();

iocContainer.bind(SecurityDeviceController).toSelf();
