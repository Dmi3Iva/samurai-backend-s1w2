import { expect } from "vitest";
import request from "supertest";
import type { Response } from "supertest";
import { app } from "../src/app";
import { ROUTES, ADMIN_AUTH_HEADER, bearerAuthHeader } from "./test.const";

interface LoginBody {
  loginOrEmail: string;
  password: string;
}

interface LoginSuccessResponse {
  accessToken: string;
}

interface MeResponse {
  userId: string;
  login: string;
  email: string;
}

class AuthTestManager {
  /** Remote checker sends login without Authorization header */
  async loginHomeworkChecker(data: LoginBody): Promise<Response> {
    return request(app).post(`${ROUTES.auth}/login`).send(data);
  }

  async login(data: LoginBody, expectedStatus = 200) {
    const response = await request(app)
      .post(`${ROUTES.auth}/login`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body as LoginSuccessResponse;
  }

  async loginAndGetTokenHomework(data: LoginBody): Promise<string> {
    const response = await this.loginHomeworkChecker(data);

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("<!DOCTYPE html>");
    expect(response.body).toEqual({
      accessToken: expect.any(String),
    });

    return response.body.accessToken;
  }

  async loginAndGetToken(data: LoginBody): Promise<string> {
    const body = await this.login(data, 200);
    expect(body).toEqual({
      accessToken: expect.any(String),
    });
    expect(body.accessToken.split(".")).toHaveLength(3);
    return body.accessToken;
  }

  async getMe(accessToken: string, expectedStatus = 200) {
    const response = await request(app)
      .get(`${ROUTES.auth}/me`)
      .set(bearerAuthHeader(accessToken));
    expect(response.status).toBe(expectedStatus);
    return response.body as MeResponse;
  }
}

export const authTestManager = new AuthTestManager();
