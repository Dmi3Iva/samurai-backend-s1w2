import { Router } from "express";
import { blogsRepository } from "../repository/blogs.repository";

export const testingRouter = Router();

testingRouter.delete("/delete-all", (req, res) => {
  blogsRepository.removeAll();
  res.status(204).send();
});
