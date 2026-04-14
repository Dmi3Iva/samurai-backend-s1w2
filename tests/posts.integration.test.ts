import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";

describe("Posts Integration Tests", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should handle full post lifecycle", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });

    // Create
    const createdPost = await postsTestManager.createEntity({
      title: "Test Post",
      shortDescription: "Test Short Desc",
      content: "Test Content",
      blogId: blog.id,
      blogName: "Test Blog",
    });

    expect(createdPost).toHaveProperty("id");

    const postId = createdPost.id;

    // Get all
    const posts = await postsTestManager.getEntities();
    expect(posts).toHaveLength(1);

    // Get by id
    const post = await postsTestManager.getEntity(postId);
    expect(post.id).toBe(postId);

    // Update
    await postsTestManager.updateEntity(postId, {
      title: "Updated Post",
      shortDescription: "Updated Short Desc",
      content: "Updated Content",
      blogId: blog.id,
      blogName: "Test Blog",
    });

    const updatedPost = await postsTestManager.getEntity(postId);
    expect(updatedPost.title).toBe("Updated Post");

    // Delete
    await postsTestManager.deleteEntity(postId);

    // Verify deleted
    await postsTestManager.getEntity(postId, 404);
  });
});
