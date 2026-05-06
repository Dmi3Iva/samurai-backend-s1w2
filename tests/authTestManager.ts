import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES } from "../src/consants/routes.conts";
import { ADMIN_AUTH_HEADER } from "./test.const";

interface LoginBody {
  loginOrEmail: string;
  password: string;
}

class AuthTestManager {
  async login(data: LoginBody, expectedStatus = 204) {
    const response = await request(app)
      .post(`${ROUTES.auth}/login`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const authTestManager = new AuthTestManager();
