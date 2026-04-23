import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("DELETE /posts/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should delete post by id", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
    });

    await postsTestManager.createEntity({
      title: "Post 1",
      shortDescription: "Short desc 1",
      content: "Content 1",
      blogId: blog.id,
    });

    await postsTestManager.createEntity({
      title: "Post 2",
      shortDescription: "Short desc 2",
      content: "Content 2",
      blogId: blog.id,
    });

    const postsBeforeDelete = await postsTestManager.getEntities();
    const firstPostId = postsBeforeDelete[0].id;

    await postsTestManager.deleteEntity(firstPostId);

    const postsAfterDelete = await postsTestManager.getEntities();
    expect(postsAfterDelete).toHaveLength(1);
    expect(postsAfterDelete[0]).toEqual({
      id: expect.any(String),
      title: "Post 2",
      shortDescription: "Short desc 2",
      content: "Content 2",
      blogId: blog.id,
      blogName: "Blog 1",
      createdAt: expect.any(String),
    });
  });

  it("should return 404 when deleting non-existent post", async () => {
    const error = await postsTestManager.deleteEntity("999", 404);

    expect(error).toEqual({ message: "Blog not found" });
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).delete(`${ROUTES.posts}/123`);

    expect(response.status).toBe(401);
  });
});
