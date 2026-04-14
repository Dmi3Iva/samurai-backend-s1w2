import e, { NextFunction } from "express";
import type { Response } from "express";
import { blogsRouter } from "./features/blogs/blogs.router";
import { testingRouter } from "./features/testing/testing.route";
import { RequestWithQuery } from "./types/request.type";

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

app.use("/blogs", blogsRouter);
app.use("/testing", testingRouter);
