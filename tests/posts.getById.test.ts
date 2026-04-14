import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /posts/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return post by id", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });

    const createdPost = await postsTestManager.createEntity({
      title: "Test Post",
      shortDescription: "Test Short Desc",
      content: "Test Content",
      blogId: blog.id,
    });

    const post = await postsTestManager.getEntity(createdPost.id);

    expect(post).toEqual({
      id: createdPost.id,
      title: "Test Post",
      shortDescription: "Test Short Desc",
      content: "Test Content",
      blogId: blog.id,
      blogName: "Test Blog",
    });
  });

  it("should return 404 for non-existent post", async () => {
    const post = await postsTestManager.getEntity("999", 404);

    expect(post).toEqual({ message: "Post not found" });
  });
});
