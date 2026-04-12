import e from "express";
import { blogsRouter } from "./features/blogs/blogs.router";
import { testingRouter } from "./features/testing/testing.route";

export const app = e();

app.use(e.json());

app.use("/blogs", blogsRouter);
app.use("/testing", testingRouter);
