import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { passwordRecoveryTestManager } from "./passwordRecoveryTestManager";
import { getRecoveryCodeByEmail } from "./passwordRecoveryTestHelpers";
import {
  ROUTES,
  PASSWORD_RECOVERY_USER,
  deliveredTestEmail,
} from "./test.const";

describe("Homework 10 — Password recovery (swagger)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should recover password: request recovery → set new password → login with new password", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );

    const recoveryCode = await getRecoveryCodeByEmail(
      PASSWORD_RECOVERY_USER.email,
    );
    const newPassword = "newPass12";

    await passwordRecoveryTestManager.setNewPassword({
      newPassword,
      recoveryCode,
    });

    const loginWithOldPassword = await authTestManager.loginHomeworkChecker({
      loginOrEmail: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
    });
    expect(loginWithOldPassword.status).toBe(401);

    const accessToken = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: PASSWORD_RECOVERY_USER.login,
      password: newPassword,
    });
    expect(accessToken.split(".")).toHaveLength(3);
  });

  it("POST /auth/password-recovery: should return 204 even if email is not registered", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/password-recovery`)
      .send({ email: deliveredTestEmail("unknown-user") });

    expect(response.status).toBe(204);
  });

  it("POST /auth/password-recovery: should return 400 for invalid email format", async () => {
    const response = await request(app)
      .post(`${ROUTES.auth}/password-recovery`)
      .send({ email: "222^gmail.com" });

    expect(response.status).toBe(400);
  });

  it("POST /auth/new-password: should return 400 when recoveryCode is incorrect", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );

    const response = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send({
        newPassword: "newPass12",
        recoveryCode: "incorrect-recovery-code",
      });

    expect(response.status).toBe(400);
  });

  it("POST /auth/new-password: should return 400 when newPassword length is invalid", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );
    const recoveryCode = await getRecoveryCodeByEmail(
      PASSWORD_RECOVERY_USER.email,
    );

    const tooShort = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send({ newPassword: "12345", recoveryCode });
    expect(tooShort.status).toBe(400);

    const tooLong = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send({ newPassword: "a".repeat(21), recoveryCode });
    expect(tooLong.status).toBe(400);
  });

  it("should not allow reusing the same recoveryCode after successful password change", async () => {
    await usersTestManager.createEntity({
      login: PASSWORD_RECOVERY_USER.login,
      password: PASSWORD_RECOVERY_USER.password,
      email: PASSWORD_RECOVERY_USER.email,
    });

    await passwordRecoveryTestManager.requestPasswordRecovery(
      PASSWORD_RECOVERY_USER.email,
    );
    const recoveryCode = await getRecoveryCodeByEmail(
      PASSWORD_RECOVERY_USER.email,
    );

    await passwordRecoveryTestManager.setNewPassword({
      newPassword: "newPass12",
      recoveryCode,
    });

    const reuseResponse = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send({ newPassword: "anotherPass1", recoveryCode });

    expect(reuseResponse.status).toBe(400);
  });
});
