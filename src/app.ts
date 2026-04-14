import e, { NextFunction, Router } from "express";
import type { Response } from "express";
import { blogsRouter } from "./features/blogs/blogs.router";
import { postsRouter } from "./features/posts/posts.router";
import { testingRouter } from "./features/testing/testing.route";
import { RequestWithQuery } from "./types/request.type";
import { ROUTES } from "./consants/routes.conts";

export const app = e();

// const authGuardMiddleware = (
//   req: RequestWithQuery<{ token: string }>,
//   res: Response,
//   next: NextFunction,
// ) => {
//   if (req.query.token === "123") {
//     next();
//   }
//   return res.sendStatus(401);
// };

app.use(e.json());

app.use(ROUTES.blogs, blogsRouter);
app.use(ROUTES.posts, postsRouter);
app.use(ROUTES.testings, testingRouter);
