import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /blogs/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return blog by id", async () => {
    const createdBlog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });

    const blog = await blogsTestManager.getEntity(createdBlog.id);

    expect(blog).toEqual({
      id: createdBlog.id,
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });
  });

  it("should return 404 for non-existent blog", async () => {
    const blog = await blogsTestManager.getEntity("999", 404);

    expect(blog).toEqual({ message: "Blog not found" });
  });
});
