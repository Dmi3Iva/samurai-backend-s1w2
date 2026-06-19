import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { authTestManager } from "./authTestManager";
import { registrationTestManager } from "./registrationTestManager";
import {
  getConfirmationCodeByEmail,
  isUserEmailConfirmed,
} from "./registrationTestHelpers";
import { ROUTES, REGISTRATION_USER } from "./test.const";

describe("POST /auth/registration-confirmation", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const registerUser = async () => {
    await registrationTestManager.register({
      login: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
      email: REGISTRATION_USER.email,
    });
  };

  it("should confirm registration with valid code and return 204", async () => {
    await registerUser();
    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);

    const response = await request(app)
      .post(`${ROUTES.auth}/registration-confirmation`)
      .send({ code });

    expect(response.status).toBe(204);
    expect(await isUserEmailConfirmed(REGISTRATION_USER.email)).toBe(true);
  });

  it("should allow login after successful confirmation", async () => {
    await registerUser();
    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);

    await registrationTestManager.confirmRegistration(code);

    const accessToken = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: REGISTRATION_USER.login,
      password: REGISTRATION_USER.password,
    });

    expect(accessToken.split(".")).toHaveLength(3);
  });

  it("should return 400 when code is missing", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration-confirmation`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "code" }),
      ]),
    );
  });

  it("should return 400 when code is incorrect", async () => {
    await registerUser();

    const response = await request(app)
      .post(`${ROUTES.auth}/registration-confirmation`)
      .send({ code: "wrong-code-12345" });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
  });

  it("should return 400 when code already been applied", async () => {
    await registerUser();
    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);

    await registrationTestManager.confirmRegistration(code);

    const response = await request(app)
      .post(`${ROUTES.auth}/registration-confirmation`)
      .send({ code });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
  });
});
