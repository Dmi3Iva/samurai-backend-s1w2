import e from "express";
import { blogsRouter } from "./features/blogs/blogs.router";
import { postsRouter } from "./features/posts/posts.router";
import { testingRouter } from "./features/testing/testing.route";
import { ROUTES } from "./consants/routes.conts";
import { authRouter } from "./features/auth/auth.router";
import { usersRouter } from "./features/users/users.router";
import { commentsRouter } from "./features/comments/comments.route";

export const app = e();

app.use(e.json());

app.use(ROUTES.auth, authRouter);
app.use(ROUTES.blogs, blogsRouter);
app.use(ROUTES.posts, postsRouter);
app.use(ROUTES.comments, commentsRouter);
app.use(ROUTES.users, usersRouter);
app.use(ROUTES.testings, testingRouter);
