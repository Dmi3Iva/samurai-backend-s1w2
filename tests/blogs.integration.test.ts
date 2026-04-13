import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";

describe("Blogs Integration Tests", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should handle full blog lifecycle", async () => {
    // Create
    const createdBlog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });

    expect(createdBlog).toHaveProperty("id");

    const blogId = createdBlog.id;

    // Get all
    const blogs = await blogsTestManager.getEntities();
    expect(blogs).toHaveLength(1);

    // Get by id
    const blog = await blogsTestManager.getEntity(blogId);
    expect(blog.id).toBe(blogId);

    // Delete
    await blogsTestManager.deleteEntity(blogId);

    // Verify deleted
    await blogsTestManager.getEntity(blogId, 404);
  });
});
