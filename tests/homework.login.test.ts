import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { appConfig } from "../src/common/appConfig";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { ROUTES, HOMEWORK_USER } from "./test.const";
import { homeworkState } from "./homeworkState";

describe("Homework 6 — Login (remote checker parity)", () => {
  beforeEach(async () => {
    homeworkState.clearAccessToken();
    await request(app).delete(`${ROUTES.testings}`);
  });

  it('POST /auth/login: should sign in user; status 200; content: JWT token', async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const response = await authTestManager.loginHomeworkChecker({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("Internal Server Error");
    expect(response.text).not.toContain("<!DOCTYPE html>");
    expect(response.body).toEqual({
      accessToken: expect.any(String),
    });
    expect(response.body.accessToken.split(".")).toHaveLength(3);

    homeworkState.setAccessToken(response.body.accessToken);
    expect(homeworkState.getAccessToken()).toBe(response.body.accessToken);
  });

  it("should not return 500 when JWT_SECRET is configured on server", async () => {
    expect(appConfig.JWT_SECRET).toBeTruthy();

    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const response = await authTestManager.loginHomeworkChecker({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    expect(response.status).not.toBe(500);
  });
});
