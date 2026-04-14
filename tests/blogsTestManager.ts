import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import type { CreateBlogModel } from "../src/features/blogs/models/blog.model";
import { ROUTES } from "../src/consants/routes.conts";

const ADMIN_AUTH_HEADER = {
  Authorization: "Basic YWRtaW46cXdlcnR5",
};

class BlogsTestManager {
  async createEntity(data: CreateBlogModel, expectedStatus = 201) {
    const response = await request(app)
      .post(`${ROUTES.blogs}`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async deleteEntity(id: string, expectedStatus = 204) {
    const response = await request(app)
      .delete(`${ROUTES.blogs}/${id}`)
      .set(ADMIN_AUTH_HEADER);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntity(id: string, expectedStatus = 200) {
    const response = await request(app).get(`${ROUTES.blogs}/${id}`);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntities(expectedStatus = 200) {
    const response = await request(app).get(`${ROUTES.blogs}`);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const blogsTestManager = new BlogsTestManager();
