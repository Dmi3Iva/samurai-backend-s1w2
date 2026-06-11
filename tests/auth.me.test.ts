import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { ROUTES, bearerAuthHeader } from "./test.const";

describe("GET /auth/me", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return current user info with valid access token", async () => {
    const user = await usersTestManager.createEntity({
      login: "meuser",
      password: "password123",
      email: "meuser@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "meuser",
      password: "password123",
    });

    const me = await authTestManager.getMe(accessToken);

    expect(me).toEqual({
      userId: user.id,
      login: "meuser",
      email: "meuser@example.com",
    });
  });

  it("should return 401 without authorization header", async () => {
    const response = await request(app).get(`${ROUTES.auth}/me`);

    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid bearer token", async () => {
    const response = await request(app)
      .get(`${ROUTES.auth}/me`)
      .set(bearerAuthHeader("invalid.token.value"));

    expect(response.status).toBe(401);
  });

  it("should return 401 with basic auth instead of bearer", async () => {
    await usersTestManager.createEntity({
      login: "basicuser",
      password: "password123",
      email: "basic@example.com",
    });

    const response = await request(app)
      .get(`${ROUTES.auth}/me`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" });

    expect(response.status).toBe(401);
  });
});
