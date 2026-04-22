import { beforeAll, afterAll } from "vitest";
import { runDB, client } from "./src/repositories/db";

beforeAll(async () => {
  await runDB();
});

afterAll(async () => {
  await client.close();
});
