import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { authTestManager } from "./authTestManager";
import { registrationTestManager } from "./registrationTestManager";
import { getConfirmationCodeByEmail } from "./registrationTestHelpers";
import { homeworkState } from "./homeworkState";
import { ROUTES, REGISTRATION_USER, deliveredTestEmail } from "./test.const";

describe("Homework 7 — Registration flow (remote checker parity)", () => {
  beforeEach(async () => {
    homeworkState.clearAccessToken();
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should complete full registration flow: register → confirm → login", async () => {
    await registrationTestManager.register({
      login: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
      email: REGISTRATION_USER.email,
    });

    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);
    await registrationTestManager.confirmRegistration(code);

    const accessToken = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: REGISTRATION_USER.email,
      password: REGISTRATION_USER.password,
    });

    homeworkState.setAccessToken(accessToken);

    const me = await authTestManager.getMe(homeworkState.getAccessToken());

    expect(me).toEqual({
      userId: expect.any(String),
      login: REGISTRATION_USER.login,
      email: REGISTRATION_USER.email,
    });
  });

  it("should complete flow with email resending: register → resend → confirm → login", async () => {
    const resendUserEmail = deliveredTestEmail("resend-u");

    await registrationTestManager.register({
      login: "resend-u",
      password: REGISTRATION_USER.password,
      email: resendUserEmail,
    });

    await registrationTestManager.resendRegistrationEmail(resendUserEmail);

    const code = await getConfirmationCodeByEmail(resendUserEmail);
    await registrationTestManager.confirmRegistration(code);

    const loginResponse = await authTestManager.loginHomeworkChecker({
      loginOrEmail: "resend-u",
      password: REGISTRATION_USER.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({
      accessToken: expect.any(String),
    });
  });
});
