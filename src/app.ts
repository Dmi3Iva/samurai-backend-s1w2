import e from "express";
import { ROUTES } from "./consants/routes.conts";
import cookieParser from "cookie-parser";
import {
  authController,
  blogsController,
  commentsController,
  postsController,
  securityDeviceController,
  testingController,
  usersController,
} from "./composition-root";

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
app.use(ROUTES.securityDevices, securityDeviceController.getRouter());
