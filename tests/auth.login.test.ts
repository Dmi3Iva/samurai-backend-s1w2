import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES } from "../src/consants/routes.conts";

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

    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: "testuser",
      password: "password123",
    });

    expect(response.status).toBe(200);
  });

  it("should login with email instead of login", async () => {
    await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
  });

  it("should return 401 with invalid password", async () => {
    await usersTestManager.createEntity({
      login: "testuser",
      password: "password123",
      email: "test@example.com",
    });

    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: "testuser",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
  });

  it("should return 401 with non-existent login", async () => {
    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: "nonexistent",
      password: "password123",
    });

    expect(response.status).toBe(401);
  });

  it("should return 401 with non-existent email", async () => {
    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: "nonexistent@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
  });

  describe("Input validation", () => {
    it("should return 400 when loginOrEmail is missing", async () => {
      const response = await request(app).post(`${ROUTES.auth}/login`).send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.errorMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "loginOrEmail",
          }),
        ]),
      );
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app).post(`${ROUTES.auth}/login`).send({
        loginOrEmail: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.body.errorMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
          }),
        ]),
      );
    });

    it("should return 400 when loginOrEmail is not a string", async () => {
      const response = await request(app).post(`${ROUTES.auth}/login`).send({
        loginOrEmail: 123,
        password: "password123",
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 when password is not a string", async () => {
      const response = await request(app).post(`${ROUTES.auth}/login`).send({
        loginOrEmail: "testuser",
        password: 123,
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 when both fields are missing", async () => {
      const response = await request(app).post(`${ROUTES.auth}/login`).send({});

      expect(response.status).toBe(400);
      expect(response.body.errorMessages).toHaveLength(2);
    });
  });

  describe("Authorization not required", () => {
    it("should allow login without authorization header", async () => {
      await usersTestManager.createEntity({
        login: "testuser",
        password: "password123",
        email: "test@example.com",
      });

      const response = await request(app)
        .post(`${ROUTES.auth}/login`)
        .send({
          loginOrEmail: "testuser",
          password: "password123",
        });

      // Should not return 401 Unauthorized
      expect(response.status).not.toBe(401);
    });
  });
});
