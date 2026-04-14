import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";

describe("PUT /posts/:id", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should update post by id", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
    });

    const createdPost = await postsTestManager.createEntity({
      title: "Original Title",
      shortDescription: "Original Short Desc",
      content: "Original Content",
      blogId: blog.id,
      blogName: "Blog 1",
    });

    await postsTestManager.updateEntity(createdPost.id, {
      title: "Updated Title",
      shortDescription: "Updated Short Desc",
      content: "Updated Content",
      blogId: blog.id,
      blogName: "Blog 1",
    });

    const updatedPost = await postsTestManager.getEntity(createdPost.id);

    expect(updatedPost.title).toBe("Updated Title");
    expect(updatedPost.shortDescription).toBe("Updated Short Desc");
    expect(updatedPost.content).toBe("Updated Content");
  });

  it("should return 404 when updating non-existent post", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
    });

    const error = await postsTestManager.updateEntity(
      "999",
      {
        title: "Updated",
        shortDescription: "Updated",
        content: "Updated",
        blogId: blog.id,
        blogName: "Blog 1",
      },
      404,
    );

    expect(error).toContain("Not found blog with id");
  });

  it("should return 400 when blog does not exist", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
    });

    const createdPost = await postsTestManager.createEntity({
      title: "Post",
      shortDescription: "Short Desc",
      content: "Content",
      blogId: blog.id,
      blogName: "Blog 1",
    });

    const error = await postsTestManager.updateEntity(
      createdPost.id,
      {
        title: "Updated",
        shortDescription: "Updated",
        content: "Updated",
        blogId: "non-existent-blog",
        blogName: "Blog",
      },
      400,
    );

    expect(error).toContain("There is no blog with id");
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).put("/posts/123").send({
      title: "Updated",
      shortDescription: "Updated",
      content: "Updated",
      blogId: "blog-id",
    });

    expect(response.status).toBe(401);
  });
});
