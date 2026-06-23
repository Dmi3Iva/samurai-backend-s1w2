import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { appConfig } from "../src/common/appConfig";
import { usersTestManager } from "./usersTestManager";
import { ROUTES, bearerAuthHeader } from "./test.const";
import {
  getMaxAgeFromSetCookie,
  getRefreshTokenFromSetCookie,
  refreshTokenCookieHeader,
} from "./authRefreshTokenTestHelpers";

const TEST_USER = {
  login: "refreuser",
  password: "password123",
  email: "refreshuser@example.com",
};

describe("h08 refresh token — expected swagger behavior", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  /**
   * Bug: /auth/refresh-token uses authorizationTokenMiddleware (Bearer access).
   * Swagger security: only refreshToken cookie, no bearer.
   */
  it("POST /auth/refresh-token: should work with only refreshToken cookie (no Authorization header)", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toEqual({
      accessToken: expect.any(String),
    });
  });

  /**
   * Bug: /auth/logout uses authorizationTokenMiddleware (Bearer access).
   * Swagger security: only refreshToken cookie.
   */
  it("POST /auth/logout: should work with only refreshToken cookie (no Authorization header)", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
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

  /**
   * Bug: res.cookie maxAge is set in seconds (RT_TIME), but Express expects milliseconds.
   * Swagger: refreshToken cookie expires after RT_TIME seconds.
   */
  it("POST /auth/login: refreshToken cookie Max-Age should equal RT_TIME in seconds", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const maxAge = getMaxAgeFromSetCookie(loginResponse.headers["set-cookie"]);

    expect(maxAge).toBe(Number(appConfig.RT_TIME));
  });

  /**
   * Bug: logout does not validate presence/signature of refreshToken from cookie.
   * Swagger: 401 if refreshToken is missing or invalid.
   */
  it("POST /auth/logout: should return 401 when refreshToken cookie is missing", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const accessToken = loginResponse.body.accessToken;

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(bearerAuthHeader(accessToken));

    expect(logoutResponse.status).toBe(401);
  });

  /**
   * Bug: same as refresh without bearer — user with expired access cannot refresh.
   * Swagger: client sends only refreshToken cookie to get a new pair.
   */
  it("POST /auth/refresh-token: should work when access token is expired but refresh cookie is valid", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const accessLifetimeMs = Number(appConfig.AC_TIME) + 500;
    await new Promise((resolve) => setTimeout(resolve, accessLifetimeMs));

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
  });

  /**
   * Expected after rotation: old refreshToken is blacklisted and cannot be reused.
   * Note: current routes still require Bearer — test uses both headers until middleware is fixed.
   */
  it("POST /auth/refresh-token: should return 401 when reusing revoked refreshToken", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const accessToken = loginResponse.body.accessToken;
    const oldRefreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(oldRefreshToken).toBeTruthy();

    const firstRefreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(bearerAuthHeader(accessToken))
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(firstRefreshResponse.status).toBe(200);

    const secondRefreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(bearerAuthHeader(firstRefreshResponse.body.accessToken))
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(secondRefreshResponse.status).toBe(401);
  });

  /**
   * After logout refreshToken must be revoked.
   * Note: uses Bearer until logout middleware is fixed to cookie-only.
   */
  it("POST /auth/refresh-token: should return 401 after logout", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const accessToken = loginResponse.body.accessToken;
    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(bearerAuthHeader(accessToken))
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(logoutResponse.status).toBe(204);

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(bearerAuthHeader(accessToken))
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(refreshResponse.status).toBe(401);
  });
});
