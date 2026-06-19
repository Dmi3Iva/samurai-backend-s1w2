import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { registrationTestManager } from "./registrationTestManager";
import { ROUTES, REGISTRATION_USER } from "./test.const";

describe("POST /auth/registration", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should accept registration data and return 204", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration`)
      .send({
        login: REGISTRATION_USER.login,
        password: REGISTRATION_USER.password,
        email: REGISTRATION_USER.email,
      });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should not require authorization header", async () => {
    await registrationTestManager.register({
      login: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
      email: REGISTRATION_USER.email,
    });
  });

  it("should return 401 on login before email confirmation", async () => {
    await registrationTestManager.register({
      login: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
      email: REGISTRATION_USER.email,
    });

    await authTestManager.loginHomeworkChecker({
      loginOrEmail: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
    }).then((response) => {
      expect(response.status).toBe(401);
    });
  });

  it("should return 400 when login already exists", async () => {
    await usersTestManager.createEntity({
      login: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
      email: "another@example.com",
    });

    const response = await request(app)
      .post(`${ROUTES.auth}/registration`)
      .send({
        login: REGISTRATION_USER.login,
        password: REGISTRATION_USER.password,
        email: REGISTRATION_USER.email,
      });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
    expect(response.body.errorsMessages[0]).toEqual(
      expect.objectContaining({
        field: expect.any(String),
        message: expect.any(String),
      }),
    );
  });

  it("should return 400 when email already exists", async () => {
    await usersTestManager.createEntity({
      login: "otherlogin",
      password: REGISTRATION_USER.password,
      email: REGISTRATION_USER.email,
    });

    const response = await request(app)
      .post(`${ROUTES.auth}/registration`)
      .send({
        login: REGISTRATION_USER.login,
        password: REGISTRATION_USER.password,
        email: REGISTRATION_USER.email,
      });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
  });

  describe("Input validation", () => {
    it("should return 400 when login is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          password: REGISTRATION_USER.password,
          email: REGISTRATION_USER.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "login" }),
        ]),
      );
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          login: REGISTRATION_USER.login,
          email: REGISTRATION_USER.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "password" }),
        ]),
      );
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          login: REGISTRATION_USER.login,
          password: REGISTRATION_USER.password,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
        ]),
      );
    });

    it("should return 400 when email has invalid format", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          login: REGISTRATION_USER.login,
          password: REGISTRATION_USER.password,
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
        ]),
      );
    });

    it("should return 400 when login is too short", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          login: "ab",
          password: REGISTRATION_USER.password,
          email: REGISTRATION_USER.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "login" }),
        ]),
      );
    });

    it("should return 400 when password is too short", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration`)
        .send({
          login: REGISTRATION_USER.login,
          password: "12345",
          email: REGISTRATION_USER.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "password" }),
        ]),
      );
    });
  });
});
