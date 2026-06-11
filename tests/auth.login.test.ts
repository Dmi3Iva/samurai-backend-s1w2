import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { appConfig } from "../src/common/appConfig";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { ROUTES, ADMIN_AUTH_HEADER } from "./test.const";

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should login with valid credentials", async () => {
    await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const loginResponse = await authTestManager.login({
      loginOrEmail: "testuser",
      password: "password123",
    });

    expect(loginResponse).toEqual({
      accessToken: expect.any(String),
    });
    expect(loginResponse.accessToken.split(".")).toHaveLength(3);
  });

  it("should return accessToken with userId matching logged in user", async () => {
    const user = await usersTestManager.createEntity({
      login: "jwtuser",
      password: "password123",
      email: "jwtuser@example.com",
    });

    const { accessToken } = await authTestManager.login({
      loginOrEmail: "jwtuser",
      password: "password123",
    });

    const decoded = jwt.verify(accessToken, appConfig.JWT_SECRET) as {
      userId: string;
    };

    expect(decoded.userId).toBe(user.id);
  });

  it("should login with email instead of login", async () => {
    await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const loginResponse = await authTestManager.login({
      loginOrEmail: "test@example.com",
      password: "password123",
    });

    expect(loginResponse).toEqual({
      accessToken: expect.any(String),
    });
  });

  it("should return 401 with invalid password", async () => {
    await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    await authTestManager.login(
      {
        loginOrEmail: "testuser",
        password: "wrongpassword",
      },
      401,
    );
  });

  it("should return 401 with non-existent login", async () => {
    await authTestManager.login(
      {
        loginOrEmail: "nonexistent",
        password: "password123",
      },
      401,
    );
  });

  it("should return 401 with non-existent email", async () => {
    await authTestManager.login(
      {
        loginOrEmail: "nonexistent@example.com",
        password: "password123",
      },
      401,
    );
  });

  describe("Input validation", () => {
    it("should return 400 when loginOrEmail is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/login`)
        .set(ADMIN_AUTH_HEADER)
        .send({
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "loginOrEmail",
          }),
        ]),
      );
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/login`)
        .set(ADMIN_AUTH_HEADER)
        .send({
          loginOrEmail: "testuser",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
          }),
        ]),
      );
    });

    it("should return 400 when loginOrEmail is not a string", async () => {
      await authTestManager.login(
        {
          loginOrEmail: 123 as any,
          password: "password123",
        },
        400,
      );
    });

    it("should return 400 when password is not a string", async () => {
      await authTestManager.login(
        {
          loginOrEmail: "testuser",
          password: 123 as any,
        },
        400,
      );
    });

    it("should return 400 when both fields are missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/login`)
        .set(ADMIN_AUTH_HEADER)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toHaveLength(2);
    });
  });
});
