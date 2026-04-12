import { Router } from "express";
import { db } from "../../db/db";

export const testingRouter = Router();

testingRouter.delete("/delete-all", (req, res) => {
  db.blogs = [];
  res.status(204).send();
});
