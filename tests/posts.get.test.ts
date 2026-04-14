import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";

describe("GET /posts", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should return empty array when no posts exist", async () => {
    const posts = await postsTestManager.getEntities();

    expect(posts).toEqual([]);
  });

  it("should return all posts", async () => {
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
      blogName: "Blog 1",
    });

    await postsTestManager.createEntity({
      title: "Post 2",
      shortDescription: "Short desc 2",
      content: "Content 2",
      blogId: blog.id,
      blogName: "Blog 1",
    });

    const posts = await postsTestManager.getEntities();

    expect(posts).toHaveLength(2);
    expect(posts[0].title).toBe("Post 1");
    expect(posts[1].title).toBe("Post 2");
  });
});
