import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES, HOMEWORK_USER, bearerAuthHeader } from "./test.const";
import {
  assertRefreshCookieIsHttpOnlyAndSecure,
  createExpiredAccessToken,
  createExpiredRefreshToken,
  getAccessTokenLifetimeMs,
  getRefreshTokenFromSetCookie,
  getRefreshTokenLifetimeMs,
  refreshTokenCookieHeader,
  waitForTokenExpiration,
} from "./authRefreshTokenTestHelpers";

describe("Homework 8 — RefreshToken (remote checker parity)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("POST /auth/login: should sign in user; status 200; JWT access token and refresh token in cookie (httpOnly, secure)", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const response = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      accessToken: expect.any(String),
    });
    expect(response.body.accessToken.split(".")).toHaveLength(3);
    assertRefreshCookieIsHttpOnlyAndSecure(response.headers["set-cookie"]);
  });

  it("GET /auth/me: should check access token and return current user data; status 200", async () => {
    const user = await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const accessToken = loginResponse.body.accessToken;

    const meResponse = await request(app)
      .get(`${ROUTES.auth}/me`)
      .set(bearerAuthHeader(accessToken));

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      userId: user.id,
      login: HOMEWORK_USER.login,
      email: HOMEWORK_USER.email,
    });
  });

  it("GET /auth/me: should return 401 when access token has expired", async () => {
    const user = await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const expiredAccessToken = createExpiredAccessToken(user.id);

    const meResponse = await request(app)
      .get(`${ROUTES.auth}/me`)
      .set(bearerAuthHeader(expiredAccessToken));

    expect(meResponse.status).toBe(401);
  });

  it("GET /auth/me: should return 401 when there is no access token in headers", async () => {
    const meResponse = await request(app).get(`${ROUTES.auth}/me`);

    expect(meResponse.status).toBe(401);
  });

  it("POST /auth/refresh-token: should return new access and refresh tokens; status 200", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const oldRefreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(oldRefreshToken).toBeTruthy();

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toEqual({
      accessToken: expect.any(String),
    });
    assertRefreshCookieIsHttpOnlyAndSecure(
      refreshResponse.headers["set-cookie"],
    );

    const newRefreshToken = getRefreshTokenFromSetCookie(
      refreshResponse.headers["set-cookie"],
    );
    expect(newRefreshToken).toBeTruthy();

    debugger;
    expect(newRefreshToken).not.toBe(oldRefreshToken);
  });

  it("POST /auth/refresh-token: should return 401 when refresh token has expired", async () => {
    const user = await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const expiredRefreshToken = createExpiredRefreshToken(user.id);

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(expiredRefreshToken));

    expect(refreshResponse.status).toBe(401);
  });

  it("POST /auth/refresh-token: should return 401 when there is no refresh token in cookie", async () => {
    const refreshResponse = await request(app).post(
      `${ROUTES.auth}/refresh-token`,
    );

    expect(refreshResponse.status).toBe(401);
  });

  it("POST /auth/refresh-token: should return 401 when refresh token has become invalid (reused after rotation)", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const oldRefreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(oldRefreshToken).toBeTruthy();

    const firstRefreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(firstRefreshResponse.status).toBe(200);

    const secondRefreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(secondRefreshResponse.status).toBe(401);
  });

  it("POST /auth/logout: should make the refresh token invalid; status 204", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(logoutResponse.status).toBe(204);
  });

  it("POST /auth/refresh-token: should return 401 after logout (invalid refresh token)", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(logoutResponse.status).toBe(204);

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(refreshResponse.status).toBe(401);
  });

  it("POST /auth/logout: should return 401 when refresh token has expired", async () => {
    const user = await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const expiredRefreshToken = createExpiredRefreshToken(user.id);

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(expiredRefreshToken));

    expect(logoutResponse.status).toBe(401);
  });

  it(
    "GET /auth/me: should return 401 after access token lifetime delay",
    async () => {
      await usersTestManager.createEntity({
        login: "expaccess",
        password: "password123",
        email: "expaccess@example.com",
      });

      const loginResponse = await request(app)
        .post(`${ROUTES.auth}/login`)
        .send({
          loginOrEmail: "expaccess",
          password: "password123",
        });

      const accessToken = loginResponse.body.accessToken;

      await waitForTokenExpiration(getAccessTokenLifetimeMs());

      const meResponse = await request(app)
        .get(`${ROUTES.auth}/me`)
        .set(bearerAuthHeader(accessToken));

      expect(meResponse.status).toBe(401);
    },
    getAccessTokenLifetimeMs() + 5000,
  );

  it(
    "POST /auth/refresh-token: should return 401 after refresh token lifetime delay",
    async () => {
      await usersTestManager.createEntity({
        login: "exprefres",
        password: "password123",
        email: "exprefres@example.com",
      });

      const loginResponse = await request(app)
        .post(`${ROUTES.auth}/login`)
        .send({
          loginOrEmail: "exprefres",
          password: "password123",
        });

      const refreshToken = getRefreshTokenFromSetCookie(
        loginResponse.headers["set-cookie"],
      );
      expect(refreshToken).toBeTruthy();

      await waitForTokenExpiration(getRefreshTokenLifetimeMs());

      const refreshResponse = await request(app)
        .post(`${ROUTES.auth}/refresh-token`)
        .set(refreshTokenCookieHeader(refreshToken!));

      expect(refreshResponse.status).toBe(401);
    },
    getRefreshTokenLifetimeMs() + 5000,
  );
});
