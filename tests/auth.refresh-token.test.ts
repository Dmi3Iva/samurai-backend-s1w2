import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES, bearerAuthHeader } from "./test.const";
import {
  getAccessTokenLifetimeMs,
  getMaxAgeMsFromSetCookie,
  getRefreshTokenFromSetCookie,
  getRefreshTokenLifetimeMs,
  refreshTokenCookieHeader,
  waitForTokenExpiration,
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

  it("POST /auth/login: refreshToken cookie Max-Age should equal RT_TIME", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const maxAgeMs = getMaxAgeMsFromSetCookie(loginResponse.headers["set-cookie"]);

    expect(maxAgeMs).toBe(getRefreshTokenLifetimeMs());
  });

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

  it(
    "POST /auth/refresh-token: should work when access token is expired but refresh cookie is valid",
    async () => {
      await usersTestManager.createEntity(TEST_USER);

      const loginResponse = await request(app)
        .post(`${ROUTES.auth}/login`)
        .send({
          loginOrEmail: TEST_USER.login,
          password: TEST_USER.password,
        });

      const refreshToken = getRefreshTokenFromSetCookie(
        loginResponse.headers["set-cookie"],
      );
      expect(refreshToken).toBeTruthy();

      await waitForTokenExpiration(getAccessTokenLifetimeMs());

      const refreshResponse = await request(app)
        .post(`${ROUTES.auth}/refresh-token`)
        .set(refreshTokenCookieHeader(refreshToken!));

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    },
    getAccessTokenLifetimeMs() + 5000,
  );

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

  it("POST /auth/logout: should return 401 when refresh token became invalid after refresh-token", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const oldRefreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(oldRefreshToken).toBeTruthy();

    const refreshResponse = await request(app)
      .post(`${ROUTES.auth}/refresh-token`)
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(refreshResponse.status).toBe(200);

    const logoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(oldRefreshToken!));

    expect(logoutResponse.status).toBe(401);
  });

  it("POST /auth/logout: should return 401 when logging out with the same refresh token twice", async () => {
    await usersTestManager.createEntity(TEST_USER);

    const loginResponse = await request(app).post(`${ROUTES.auth}/login`).send({
      loginOrEmail: TEST_USER.login,
      password: TEST_USER.password,
    });

    const refreshToken = getRefreshTokenFromSetCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeTruthy();

    const firstLogoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(firstLogoutResponse.status).toBe(204);

    const secondLogoutResponse = await request(app)
      .post(`${ROUTES.auth}/logout`)
      .set(refreshTokenCookieHeader(refreshToken!));

    expect(secondLogoutResponse.status).toBe(401);
  });

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
