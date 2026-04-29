import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /posts", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return empty array when no posts exist", async () => {
    const response = await postsTestManager.getEntities();

    expect(response).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      pagesCount: 0,
      totalCount: 0,
    });
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
    });

    await postsTestManager.createEntity({
      title: "Post 2",
      shortDescription: "Short desc 2",
      content: "Content 2",
      blogId: blog.id,
    });

    const response = await postsTestManager.getEntities();

    expect(response.items).toHaveLength(2);
    // Posts are sorted by createdAt desc, so Post 2 (created later) comes first
    expect(response.items[0]).toEqual({
      id: expect.any(String),
      title: "Post 2",
      shortDescription: "Short desc 2",
      content: "Content 2",
      blogId: blog.id,
      blogName: "Blog 1",
      createdAt: expect.any(String),
    });
    expect(response.items[1]).toEqual({
      id: expect.any(String),
      title: "Post 1",
      shortDescription: "Short desc 1",
      content: "Content 1",
      blogId: blog.id,
      blogName: "Blog 1",
      createdAt: expect.any(String),
    });
  });
});
