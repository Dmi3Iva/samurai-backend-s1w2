import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { passwordRecoveryTestManager } from "./passwordRecoveryTestManager";
import { getRecoveryCodeByEmail } from "./passwordRecoveryTestHelpers";
import {
  ROUTES,
  PASSWORD_RECOVERY_USER,
  deliveredTestEmail,
} from "./test.const";

describe("POST /auth/password-recovery", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should accept valid email of existing user and return 204", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    const response = await request(app)
      .post(`${ROUTES.auth}/password-recovery`)
      .send({ email: PASSWORD_RECOVERY_USER.email });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should store recoveryCode in DB for existing user", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );

    const code = await getRecoveryCodeByEmail(PASSWORD_RECOVERY_USER.email);
    expect(code.length).toBeGreaterThan(0);
  });

  it("should return 204 for unregistered email (do not reveal whether email exists)", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/password-recovery`)
      .send({ email: deliveredTestEmail("not-registered") });

    expect(response.status).toBe(204);
  });

  describe("Input validation", () => {
    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/password-recovery`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 when email has invalid format", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/password-recovery`)
        .send({ email: "222^gmail.com" });

      expect(response.status).toBe(400);
    });
  });
});

describe("POST /auth/new-password", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const prepareRecoveryCode = async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });
    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );
    return getRecoveryCodeByEmail(PASSWORD_RECOVERY_USER.email);
  };

  it("should accept valid recoveryCode and newPassword and return 204", async () => {
    const recoveryCode = await prepareRecoveryCode();

    const response = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send({ newPassword: "newPass12", recoveryCode });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  describe("Input validation", () => {
    it("should return 400 when newPassword is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/new-password`)
        .send({ recoveryCode: "any-code" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when recoveryCode is missing", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/new-password`)
        .send({ newPassword: "newPass12" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when newPassword is shorter than 6", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/new-password`)
        .send({ newPassword: "12345", recoveryCode: "any-code" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when newPassword is longer than 20", async () => {
      const response = await request(app)
        .post(`${ROUTES.auth}/new-password`)
        .send({ newPassword: "a".repeat(21), recoveryCode: "any-code" });

      expect(response.status).toBe(400);
    });
  });
});
