import { describe, it, expect, beforeEach } from "vitest";
import request, { type Test } from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import {
  ROUTES,
  HOMEWORK_USER,
  REGISTRATION_USER,
  deliveredTestEmail,
} from "./test.const";

const RATE_LIMIT_IP = "198.51.100.10";
const OTHER_IP = "198.51.100.20";

const withIp = (req: Test, ip = RATE_LIMIT_IP) =>
  req.set("X-Forwarded-For", ip);

/**
 * Swagger: more than 5 attempts from one IP during 10 seconds → 429.
 * First 5 must not be 429; 6th must be 429.
 */
const expectRateLimitedOnSixth = async (requestFactory: () => Test) => {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await requestFactory();
    expect(response.status, `attempt ${attempt} should not be 429`).not.toBe(
      429,
    );
  }

  const blocked = await requestFactory();
  expect(blocked.status).toBe(429);
};

describe("Homework 9 — Auth rate limiting (swagger 429)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("POST /auth/login: should return 429 after more than 5 attempts from one IP", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    await expectRateLimitedOnSixth(() =>
      withIp(
        request(app).post(`${ROUTES.auth}/login`).send({
          loginOrEmail: HOMEWORK_USER.login,
          password: "wrong-password",
        }),
      ),
    );
  });

  it("POST /auth/registration: should return 429 after more than 5 attempts from one IP", async () => {
    // Same payload on purpose: only the first attempt can send an email,
    // the rest are rejected by uniqueness check, so no extra SMTP calls happen.
    await expectRateLimitedOnSixth(() =>
      withIp(
        request(app)
          .post(`${ROUTES.auth}/registration`)
          .send({
            login: "rl-user",
            password: REGISTRATION_USER.password,
            email: deliveredTestEmail("rate-limit-registration"),
          }),
      ),
    );
  });

  it("POST /auth/registration-confirmation: should return 429 after more than 5 attempts from one IP", async () => {
    await expectRateLimitedOnSixth(() =>
      withIp(
        request(app)
          .post(`${ROUTES.auth}/registration-confirmation`)
          .send({ code: "invalid-code" }),
      ),
    );
  });

  it("POST /auth/registration-email-resending: should return 429 after more than 5 attempts from one IP", async () => {
    // Email is not registered, so the endpoint answers 400 without sending anything;
    // swagger only requires the 6th attempt from one IP to be 429.
    await expectRateLimitedOnSixth(() =>
      withIp(
        request(app)
          .post(`${ROUTES.auth}/registration-email-resending`)
          .send({ email: deliveredTestEmail("rate-limit-resending") }),
      ),
    );
  });

  it("should count attempts separately per endpoint URL", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    for (let attempt = 1; attempt <= 5; attempt++) {
      const loginResponse = await withIp(
        request(app).post(`${ROUTES.auth}/login`).send({
          loginOrEmail: HOMEWORK_USER.login,
          password: "wrong-password",
        }),
      );
      expect(loginResponse.status).not.toBe(429);
    }

    for (let attempt = 1; attempt <= 5; attempt++) {
      const registrationResponse = await withIp(
        request(app)
          .post(`${ROUTES.auth}/registration`)
          .send({
            login: "rl-user",
            password: REGISTRATION_USER.password,
            email: deliveredTestEmail("rate-limit-per-url"),
          }),
      );
      expect(registrationResponse.status).not.toBe(429);
    }

    const sixthLogin = await withIp(
      request(app).post(`${ROUTES.auth}/login`).send({
        loginOrEmail: HOMEWORK_USER.login,
        password: "wrong-password",
      }),
    );
    expect(sixthLogin.status).toBe(429);
  });

  it("should count attempts separately per IP address", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await withIp(
        request(app).post(`${ROUTES.auth}/login`).send({
          loginOrEmail: HOMEWORK_USER.login,
          password: "wrong-password",
        }),
        RATE_LIMIT_IP,
      );
      expect(response.status).not.toBe(429);
    }

    const otherIpResponse = await withIp(
      request(app).post(`${ROUTES.auth}/login`).send({
        loginOrEmail: HOMEWORK_USER.login,
        password: "wrong-password",
      }),
      OTHER_IP,
    );
    expect(otherIpResponse.status).not.toBe(429);
  });
});
