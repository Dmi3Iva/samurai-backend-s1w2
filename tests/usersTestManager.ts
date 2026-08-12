import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import type { IUsersPostBody } from "../src/features/users/models/user-types";
import { ROUTES } from "../src/consants/routes.conts";

const ADMIN_AUTH_HEADER = {
  Authorization: "Basic YWRtaW46cXdlcnR5",
};

interface CreateUserResponse {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

interface GetUsersResponse {
  items: CreateUserResponse[];
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
}

class UsersTestManager {
  async createEntity(data: IUsersPostBody, expectedStatus = 201) {
    const response = await request(app)
      .post(`${ROUTES.users}`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body as CreateUserResponse;
  }

  async deleteEntity(id: string, expectedStatus = 204) {
    const response = await request(app)
      .delete(`${ROUTES.users}/${id}`)
      .set(ADMIN_AUTH_HEADER);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntities(expectedStatus = 200) {
    const response = await request(app)
      .get(`${ROUTES.users}`)
      .set(ADMIN_AUTH_HEADER);
    expect(response.status).toBe(expectedStatus);
    return response.body as GetUsersResponse;
  }

  async getEntitiesWithQuery(
    query: Record<string, string>,
    expectedStatus = 200,
  ) {
    const response = await request(app)
      .get(`${ROUTES.users}`)
      .set(ADMIN_AUTH_HEADER)
      .query(query);
    expect(response.status).toBe(expectedStatus);
    return response.body as GetUsersResponse;
  }
}

export const usersTestManager = new UsersTestManager();
