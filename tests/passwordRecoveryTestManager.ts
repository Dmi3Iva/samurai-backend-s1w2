import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES } from "./test.const";

class PasswordRecoveryTestManager {
  async requestPasswordRecovery(email: string, expectedStatus = 204) {
    const response = await request(app)
      .post(`${ROUTES.auth}/password-recovery`)
      .send({ email });
    expect(response.status).toBe(expectedStatus);
    return response;
  }

  async setNewPassword(
    data: { newPassword: string; recoveryCode: string },
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .post(`${ROUTES.auth}/new-password`)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response;
  }
}

export const passwordRecoveryTestManager = new PasswordRecoveryTestManager();
