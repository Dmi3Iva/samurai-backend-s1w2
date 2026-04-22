import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("PUT /posts/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
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
    });

    await postsTestManager.updateEntity(createdPost.id, {
      title: "Updated Title",
      shortDescription: "Updated Short Desc",
      content: "Updated Content",
      blogId: blog.id,
    });

    const updatedPost = await postsTestManager.getEntity(createdPost.id);

    expect(updatedPost).toEqual({
      id: createdPost.id,
      title: "Updated Title",
      shortDescription: "Updated Short Desc",
      content: "Updated Content",
      blogId: blog.id,
      blogName: "Blog 1",
    });
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
      },
      404,
    );

    expect(error).toContain("Not found blog with id");
  });

  it("should return 404 when blog does not exist", async () => {
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
    });

    const error = await postsTestManager.updateEntity(
      createdPost.id,
      {
        title: "Updated",
        shortDescription: "Updated",
        content: "Updated",
        blogId: "non-existent-blog",
      },
      404,
    );

    expect(error).toContain("Not found blog with id");
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).put(`${ROUTES.posts}/123`).send({
      title: "Updated",
      shortDescription: "Updated",
      content: "Updated",
      blogId: "blog-id",
    });

    expect(response.status).toBe(401);
  });
});
