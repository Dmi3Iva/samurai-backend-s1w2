import { beforeAll, afterAll } from "vitest";
import { runDB, client } from "./src/repositories/database";

beforeAll(async () => {
  await runDB();
});

afterAll(async () => {
  await client.close();
});
