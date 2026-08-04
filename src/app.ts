import e from "express";
import { ROUTES } from "./consants/routes.conts";
import cookieParser from "cookie-parser";
import { iocContainer } from "./composition-root";
import { UsersController } from "./features/users/users.router";
import { CommentsController } from "./features/comments/comments.route";
import { AuthController } from "./features/auth/auth.router";
import { BlogsController } from "./features/blogs/blogs.router";
import { PostsController } from "./features/posts/posts.router";
import { TestingController } from "./features/testing/testing.route";
import { SecurityDeviceController } from "./features/security-devices/security-devices.router";

export const app = e();

app.use(e.json());
app.use(cookieParser());
app.set("trust proxy", true);

const usersController = iocContainer.get(UsersController);
const commentsController = iocContainer.get(CommentsController);
const authController = iocContainer.get(AuthController);
const blogsController = iocContainer.get(BlogsController);
const postsController = iocContainer.get(PostsController);
const testingController = iocContainer.get(TestingController);
const securityDeviceController = iocContainer.get(SecurityDeviceController);

app.use(ROUTES.auth, authController.getRouter());
app.use(ROUTES.blogs, blogsController.getRouter());
app.use(ROUTES.posts, postsController.getRouter());
app.use(ROUTES.comments, commentsController.getRouter());
app.use(ROUTES.users, usersController.getRouter());
app.use(ROUTES.testings, testingController.getRouter());
app.use(ROUTES.securityDevices, securityDeviceController.getRouter());
