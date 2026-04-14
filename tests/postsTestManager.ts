import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import type { IPostCreateModel } from "../src/features/posts/models/post.model";

const ADMIN_AUTH_HEADER = {
  Authorization: "Basic YWRtaW46cXdlcnR5",
};

class PostsTestManager {
  async createEntity(data: IPostCreateModel, expectedStatus = 201) {
    const response = await request(app)
      .post("/posts")
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async deleteEntity(id: string, expectedStatus = 204) {
    const response = await request(app)
      .delete(`/posts/${id}`)
      .set(ADMIN_AUTH_HEADER);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async updateEntity(
    id: string,
    data: IPostCreateModel,
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .put(`/posts/${id}`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntity(id: string, expectedStatus = 200) {
    const response = await request(app).get(`/posts/${id}`);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntities(expectedStatus = 200) {
    const response = await request(app).get("/posts");
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const postsTestManager = new PostsTestManager();
