import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";

describe("GET /posts/:id", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
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
      blogName: "Test Blog",
    });

    const post = await postsTestManager.getEntity(createdPost.id);

    expect(post.id).toBe(createdPost.id);
    expect(post.title).toBe("Test Post");
    expect(post.content).toBe("Test Content");
  });

  it("should return 404 for non-existent post", async () => {
    const post = await postsTestManager.getEntity("999", 404);

    expect(post).toEqual({ message: "Post not found" });
  });
});
