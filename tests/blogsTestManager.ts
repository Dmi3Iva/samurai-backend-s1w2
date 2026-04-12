import request from "supertest";
import { app } from "../src/app";
import type { CreateBlogModel } from "../src/features/blogs/models";

class BlogsTestManager {
  async createEntity(data: CreateBlogModel) {
    const response = await request(app).post("/blogs").send(data);
    return response;
  }

  async deleteEntity(id: string) {
    const response = await request(app).delete(`/blogs/${id}`);
    return response;
  }

  async getEntity(id: string) {
    const response = await request(app).get(`/blogs/${id}`);
    return response;
  }

  async getEntities() {
    const response = await request(app).get("/blogs");
    return response;
  }
}

export const blogsTestManager = new BlogsTestManager();
