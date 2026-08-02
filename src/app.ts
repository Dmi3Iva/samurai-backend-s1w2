import e from "express";
import { blogsController } from "./features/blogs/blogs.router";
import { testingController } from "./features/testing/testing.route";
import { ROUTES } from "./consants/routes.conts";
import { authController } from "./features/auth/auth.router";
import { usersController } from "./features/users/users.router";
import cookieParser from "cookie-parser";
import { securityDeviceRouter } from "./features/security-devices/security-devices.router";
import { postsController } from "./features/posts/posts.router";
import { commentsController } from "./features/comments/comments.route";

export const app = e();

app.use(e.json());
app.use(cookieParser());
app.set("trust proxy", true);

app.use(ROUTES.auth, authController.getRouter());
app.use(ROUTES.blogs, blogsController.getRouter());
app.use(ROUTES.posts, postsController.getRouter());
app.use(ROUTES.comments, commentsController.getRouter());
app.use(ROUTES.users, usersController.getRouter());
app.use(ROUTES.testings, testingController.getRouter());
// TODO:: refactor 6
app.use(ROUTES.securityDevices, securityDeviceRouter);
