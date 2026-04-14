import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("PUT /blogs/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should update blog by id", async () => {
    const createdBlog = await blogsTestManager.createEntity({
      name: "Original Blog",
      description: "Original Description",
      websiteUrl: "https://original.com",
    });

    const response = await request(app)
      .put(`${ROUTES.blogs}/${createdBlog.id}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Updated Blog",
        description: "Updated Description",
        websiteUrl: "https://updated.com",
      });

    expect(response.status).toBe(204);

    const updatedBlog = await blogsTestManager.getEntity(createdBlog.id);
    expect(updatedBlog).toEqual({
      id: createdBlog.id,
      name: "Updated Blog",
      description: "Updated Description",
      websiteUrl: "https://updated.com",
    });
  });

  it("should return 404 when updating non-existent blog", async () => {
    const response = await request(app)
      .put(`${ROUTES.blogs}/999`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Updated",
        description: "Updated",
        websiteUrl: "https://updated.com",
      });

    expect(response.status).toBe(404);
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app)
      .put(`${ROUTES.blogs}/123`)
      .send({
        name: "Updated",
        description: "Updated",
        websiteUrl: "https://updated.com",
      });

    expect(response.status).toBe(401);
  });

  it("should return 400 when validation fails", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Description",
      websiteUrl: "https://test.com",
    });

    const response = await request(app)
      .put(`${ROUTES.blogs}/${blog.id}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "a".repeat(16),
        description: "Description",
        websiteUrl: "https://test.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toBeInstanceOf(Array);
  });
});
