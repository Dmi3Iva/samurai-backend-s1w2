import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import type { CreateBlogModel } from "../src/features/blogs/models";

class BlogsTestManager {
  async createEntity(data: CreateBlogModel, expectedStatus = 201) {
    const response = await request(app).post("/blogs").send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async deleteEntity(id: string, expectedStatus = 204) {
    const response = await request(app).delete(`/blogs/${id}`);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntity(id: string, expectedStatus = 200) {
    const response = await request(app).get(`/blogs/${id}`);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntities(expectedStatus = 200) {
    const response = await request(app).get("/blogs");
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const blogsTestManager = new BlogsTestManager();
