import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /posts - Pagination and Sorting", () => {
  let blogId: string;

  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);

    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });
    blogId = blog.id;
  });

  describe("Pagination", () => {
    it("should return default page size (10)", async () => {
      // Create 15 posts
      for (let i = 1; i <= 15; i++) {
        await postsTestManager.createEntity({
          title: `Post ${i}`,
          shortDescription: `Short desc ${i}`,
          content: `Content ${i}`,
          blogId,
        });
      }

      const response = await postsTestManager.getEntities();

      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.totalCount).toBe(15);
      expect(response.pagesCount).toBe(2);
      expect(response.items).toHaveLength(10);
    });

    it("should return empty array for page beyond available", async () => {
      await postsTestManager.createEntity({
        title: "Post 1",
        shortDescription: "Desc",
        content: "Content",
        blogId,
      });

      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ pageNumber: 10, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.totalCount).toBe(1);
    });
  });

  describe("Sorting", () => {
    beforeEach(async () => {
      await postsTestManager.createEntity({
        title: "Charlie Post",
        shortDescription: "Desc C",
        content: "Content C",
        blogId,
      });

      await postsTestManager.createEntity({
        title: "Alpha Post",
        shortDescription: "Desc A",
        content: "Content A",
        blogId,
      });

      await postsTestManager.createEntity({
        title: "Bravo Post",
        shortDescription: "Desc B",
        content: "Content B",
        blogId,
      });
    });

    it("should sort by createdAt descending (newest first) - default", async () => {
      const response = await request(app).get(`${ROUTES.posts}`);

      expect(response.status).toBe(200);
      expect(response.body.items[0].title).toBe("Bravo Post");
      expect(response.body.items[2].title).toBe("Charlie Post");
    });
  });

  describe("Filter by blogId", () => {
    let blog2Id: string;

    beforeEach(async () => {
      const blog2 = await blogsTestManager.createEntity({
        name: "Blog 2",
        description: "Description 2",
        websiteUrl: "https://blog2.com",
      });
      blog2Id = blog2.id;

      // Posts for blog 1
      await postsTestManager.createEntity({
        title: "Blog 1 Post 1",
        shortDescription: "Desc",
        content: "Content",
        blogId,
      });

      await postsTestManager.createEntity({
        title: "Blog 1 Post 2",
        shortDescription: "Desc",
        content: "Content",
        blogId,
      });

      // Posts for blog 2
      await postsTestManager.createEntity({
        title: "Blog 2 Post 1",
        shortDescription: "Desc",
        content: "Content",
        blogId: blog2Id,
      });

      await postsTestManager.createEntity({
        title: "Blog 2 Post 2",
        shortDescription: "Desc",
        content: "Content",
        blogId: blog2Id,
      });

      await postsTestManager.createEntity({
        title: "Blog 2 Post 3",
        shortDescription: "Desc",
        content: "Content",
        blogId: blog2Id,
      });
    });

    it("should filter posts by blogId", async () => {
      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ blogId });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((p: any) => p.blogId === blogId)).toBe(
        true,
      );
    });

    it("should return correct totalCount when filtering by blogId", async () => {
      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ blogId });

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(2);
    });

    it("should return all posts when no blogId specified", async () => {
      const response = await request(app).get(`${ROUTES.posts}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(5);
      expect(response.body.totalCount).toBe(5);
    });
  });
});
