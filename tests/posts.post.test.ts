import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("POST /posts", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should create new post", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "New Blog",
      description: "New Description",
      websiteUrl: "https://newblog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "New Post",
      shortDescription: "New Short Description",
      content: "New Content",
      blogId: blog.id,
    });

    expect(post).toEqual({
      id: expect.any(String),
      title: "New Post",
      shortDescription: "New Short Description",
      content: "New Content",
      blogId: blog.id,
      blogName: "New Blog",
    });
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).post(`${ROUTES.posts}`).send({
      title: "Post",
      shortDescription: "Desc",
      content: "Content",
      blogId: "some-id",
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 when blog does not exist", async () => {
    const error = await postsTestManager.createEntity(
      {
        title: "Post",
        shortDescription: "Desc",
        content: "Content",
        blogId: "non-existent-blog-id",
      },
      400,
    );

    expect(error).toContain("There is no blog with id");
  });

  it("should return validation errors for all missing fields", async () => {
    const response = await request(app)
      .post(`${ROUTES.posts}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(4);
  });

  it("should return validation error when title exceeds max length", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog",
      description: "Description",
      websiteUrl: "https://blog.com",
    });

    const error = await postsTestManager.createEntity(
      {
        title: "a".repeat(31),
        shortDescription: "Desc",
        content: "Content",
        blogId: blog.id,
      },
      400,
    );

    expect(error).toBeInstanceOf(Array);
    expect(
      error.some((e: unknown) => (e as { path: string }).path === "title"),
    ).toBe(true);
  });

  it("should return validation error when shortDescription exceeds max length", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog",
      description: "Description",
      websiteUrl: "https://blog.com",
    });

    const error = await postsTestManager.createEntity(
      {
        title: "Post",
        shortDescription: "a".repeat(101),
        content: "Content",
        blogId: blog.id,
      },
      400,
    );

    expect(error).toBeInstanceOf(Array);
    expect(
      error.some((e: unknown) => (e as { path: string }).path === "shortDescription"),
    ).toBe(true);
  });

  it("should return validation error when content exceeds max length", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog",
      description: "Description",
      websiteUrl: "https://blog.com",
    });

    const error = await postsTestManager.createEntity(
      {
        title: "Post",
        shortDescription: "Desc",
        content: "a".repeat(101),
        blogId: blog.id,
      },
      400,
    );

    expect(error).toBeInstanceOf(Array);
    expect(
      error.some((e: unknown) => (e as { path: string }).path === "content"),
    ).toBe(true);
  });

  it("should return validation error when title is not a string", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog",
      description: "Description",
      websiteUrl: "https://blog.com",
    });

    const error = await postsTestManager.createEntity(
      {
        title: 123,
        shortDescription: "Desc",
        content: "Content",
        blogId: blog.id,
      },
      400,
    );

    expect(error).toBeInstanceOf(Array);
  });

  it("should save post to db", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Saved Blog",
      description: "Saved Description",
      websiteUrl: "https://saved.com",
    });

    await postsTestManager.createEntity({
      title: "Saved Post",
      shortDescription: "Saved Short Desc",
      content: "Saved Content",
      blogId: blog.id,
    });

    const posts = await postsTestManager.getEntities();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      id: expect.any(String),
      title: "Saved Post",
      shortDescription: "Saved Short Desc",
      content: "Saved Content",
      blogId: blog.id,
      blogName: "Saved Blog",
    });
  });
});
