import { Router } from "express";
import { registerDeleteHandler } from "./handlers/delete-by-param-id.handler";
import { registerGetHandler } from "./handlers/get.handler";
import { registerPostHandler } from "./handlers/post.handler";

export const usersRouter = Router();

registerDeleteHandler(usersRouter);
registerGetHandler(usersRouter);
registerPostHandler(usersRouter);
