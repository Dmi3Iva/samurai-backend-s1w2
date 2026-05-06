import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES } from "../src/consants/routes.conts";
import { ADMIN_AUTH_HEADER } from "./test.const";

describe("DELETE /users/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should delete user by id", async () => {
    const user = await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    await usersTestManager.deleteEntity(user.id);

    const getAllUsers = await usersTestManager.getEntities();
    expect(getAllUsers.items).toHaveLength(0);
  });

  it("should return 204 on successful deletion", async () => {
    const user = await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const response = await request(app)
      .delete(`${ROUTES.users}/${user.id}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5");

    expect(response.status).toBe(204);
  });

  it("should return 404 when user does not exist", async () => {
    const nonExistentId = "507f1f77bcf86cd799439011";

    const response = await request(app)
      .delete(`${ROUTES.users}/${nonExistentId}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5");

    expect(response.status).toBe(404);
  });

  it("should return 401 when authorization header is missing", async () => {
    const user = await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const response = await request(app).delete(`${ROUTES.users}/${user.id}`);

    expect(response.status).toBe(401);
  });

  it("should return 400 when id is invalid", async () => {
    const invalidId = "invalid-id";

    const response = await request(app)
      .delete(`${ROUTES.users}/${invalidId}`)
      .set(ADMIN_AUTH_HEADER);

    expect(response.status).toBe(404);
  });

  describe("Delete multiple users", () => {
    it("should delete users independently", async () => {
      const user1 = await usersTestManager.createEntity({
        login: "user1",
        password: "password123",
        email: "user1@example.com",
      });

      const user2 = await usersTestManager.createEntity({
        login: "user2",
        password: "password123",
        email: "user2@example.com",
      });

      const user3 = await usersTestManager.createEntity({
        login: "user3",
        password: "password123",
        email: "user3@example.com",
      });

      await usersTestManager.deleteEntity(user2.id);

      const allUsers = await usersTestManager.getEntities();
      expect(allUsers.items).toHaveLength(2);
      expect(allUsers.items.some((u) => u.id === user1.id)).toBe(true);
      expect(allUsers.items.some((u) => u.id === user3.id)).toBe(true);
      expect(allUsers.items.some((u) => u.id === user2.id)).toBe(false);
    });
  });
});
