import e from "express";
import { blogsRouter } from "./features/blogs/blogs.router";
import { postsRouter } from "./features/posts/posts.router";
import { testingRouter } from "./features/testing/testing.route";
import { ROUTES } from "./consants/routes.conts";

export const app = e();

app.use(e.json());

app.use(ROUTES.blogs, blogsRouter);
app.use(ROUTES.posts, postsRouter);
app.use(ROUTES.testings, testingRouter);
