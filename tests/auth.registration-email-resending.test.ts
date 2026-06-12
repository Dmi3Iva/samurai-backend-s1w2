import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { registrationTestManager } from "./registrationTestManager";
import {
  getConfirmationCodeByEmail,
  isUserEmailConfirmed,
} from "./registrationTestHelpers";
import { ROUTES, REGISTRATION_USER } from "./test.const";

describe("POST /auth/registration-email-resending", () => {
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

  it("should resend confirmation email and return 204", async () => {
    await registerUser();

    const response = await request(app)
      .post(`${ROUTES.auth}/registration-email-resending`)
      .send({ email: REGISTRATION_USER.email });

    expect(response.status).toBe(204);
  });

  it("should generate new confirmation code after resending", async () => {
    await registerUser();
    const oldCode = await getConfirmationCodeByEmail(REGISTRATION_USER.email);

    await registrationTestManager.resendRegistrationEmail(
      REGISTRATION_USER.email,
    );

    const newCode = await getConfirmationCodeByEmail(REGISTRATION_USER.email);
    expect(newCode).toBeTruthy();
    expect(newCode).not.toBe(oldCode);
  });

  it("should confirm registration with code received after resending", async () => {
    await registerUser();
    await registrationTestManager.resendRegistrationEmail(
      REGISTRATION_USER.email,
    );

    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);
    await registrationTestManager.confirmRegistration(code);

    expect(await isUserEmailConfirmed(REGISTRATION_USER.email)).toBe(true);
  });

  it("should return 400 when email is not registered", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration-email-resending`)
      .send({ email: "notregistered@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
  });

  it("should return 400 when email is already confirmed", async () => {
    await registerUser();
    const code = await getConfirmationCodeByEmail(REGISTRATION_USER.email);
    await registrationTestManager.confirmRegistration(code);

    const response = await request(app)
      .post(`${ROUTES.auth}/registration-email-resending`)
      .send({ email: REGISTRATION_USER.email });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toHaveLength(1);
  });

  describe("Input validation", () => {
    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration-email-resending`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
        ]),
      );
    });

    it("should return 400 when email has invalid format", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/registration-email-resending`)
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
        ]),
      );
    });
  });
});
