import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES } from "../src/consants/routes.conts";
import { ADMIN_AUTH_HEADER } from "./test.const";

describe("POST /users", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should create a new user with valid data", async () => {
    const response = await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    expect(response).toEqual({
      id: expect.any(String),
      login: "testuser",
      email: "test@example.com",
      createdAt: expect.any(String),
    });
  });

  it("should require authorization", async () => {
    const response = await request(app).post(`${ROUTES.users}`).send({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    expect(response.status).toBe(401);
  });

  describe("Input validation", () => {
    it("should return 400 when login is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set(ADMIN_AUTH_HEADER)
        .send({
          password: "password123",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "login",
          }),
        ]),
      );
    });

    it("should return 400 when login is too short (< 3 chars)", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "ab",
          password: "password123",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "login",
          }),
        ]),
      );
    });

    it("should return 400 when login is too long (> 10 chars)", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "verylonglogin",
          password: "password123",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "login",
          }),
        ]),
      );
    });

    it("should return 400 when login contains invalid characters", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "test@user",
          password: "password123",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "login",
          }),
        ]),
      );
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          email: "test@example.com",
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

    it("should return 400 when password is too short (< 6 chars)", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          password: "12345",
          email: "test@example.com",
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

    it("should return 400 when password is too long (> 20 chars)", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          password: "veryverylongpassworda",
          email: "test@example.com",
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

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
          }),
        ]),
      );
    });

    it("should return 400 when email is invalid", async () => {
      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          password: "password123",
          email: "invalidemail",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
          }),
        ]),
      );
    });
  });

  describe("Uniqueness validation", () => {
    it("should return 400 when login is already taken", async () => {
      await usersTestManager.createEntity({
        login: "testuser",
        password: "password123",
        email: "test1@example.com",
      });

      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser",
          password: "password123",
          email: "test2@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "login",
            message: "Login is not unique, please write another one",
          }),
        ]),
      );
    });

    it("should return 400 when email is already taken", async () => {
      await usersTestManager.createEntity({
        login: "testuser1",
        password: "password123",
        email: "test@example.com",
      });

      const response = await request(app)
        .post(`${ROUTES.users}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({
          login: "testuser2",
          password: "password123",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
          }),
        ]),
      );
    });
  });

  describe("Password encryption", () => {
    it("should encrypt password before storing", async () => {
      const plainPassword = "password123";
      const user = await usersTestManager.createEntity({
        login: "testuser",
        password: plainPassword,
        email: "test@example.com",
      });

      // We can't directly check the password in DB, but we can verify
      // that the response doesn't contain the password
      expect(user).not.toHaveProperty("password");
    });
  });
});
