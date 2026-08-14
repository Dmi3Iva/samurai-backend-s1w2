import { beforeAll, afterAll } from "vitest";
import { runDB } from "./src/repositories/database";
import mongoose from "mongoose";

beforeAll(async () => {
  await runDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
