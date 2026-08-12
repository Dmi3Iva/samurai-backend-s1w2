import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES } from "./test.const";
import type { IUsersPostBody } from "../src/features/users/models/user-types";

class RegistrationTestManager {
  async register(data: IUsersPostBody, expectedStatus = 204) {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration`)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async confirmRegistration(code: string, expectedStatus = 204) {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration-confirmation`)
      .send({ code });
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async resendRegistrationEmail(email: string, expectedStatus = 204) {
    const response = await request(app)
      .post(`${ROUTES.auth}/registration-email-resending`)
      .send({ email });
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const registrationTestManager = new RegistrationTestManager();
