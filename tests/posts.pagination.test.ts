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

  describe("Sorting by createdAt", () => {
    beforeEach(async () => {
      await postsTestManager.createEntity({
        title: "First Post",
        shortDescription: "Desc 1",
        content: "Content 1",
        blogId,
      });

      await postsTestManager.createEntity({
        title: "Second Post",
        shortDescription: "Desc 2",
        content: "Content 2",
        blogId,
      });

      await postsTestManager.createEntity({
        title: "Third Post",
        shortDescription: "Desc 3",
        content: "Content 3",
        blogId,
      });
    });

    it("should sort by createdAt ascending (oldest first)", async () => {
      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ sortBy: "createdAt", sortDirection: "asc" });

      expect(response.status).toBe(200);
      expect(response.body.items[0].title).toBe("First Post");
      expect(response.body.items[2].title).toBe("Third Post");
    });

    it("should sort by createdAt descending (newest first) - default", async () => {
      const response = await request(app).get(`${ROUTES.posts}`);

      expect(response.status).toBe(200);
      expect(response.body.items[0].title).toBe("Third Post");
      expect(response.body.items[2].title).toBe("First Post");
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

  describe("BUG: sorting by blogName", () => {
    let blogIds: string[] = [];

    beforeEach(async () => {
      // Create 12 blogs with names "new blog0" through "new blog11"
      for (let i = 0; i <= 11; i++) {
        const blog = await blogsTestManager.createEntity({
          name: `new blog${i}`,
          description: "description",
          websiteUrl: "https://someurl.com",
        });
        blogIds.push(blog.id);

        await postsTestManager.createEntity({
          title: "post title",
          shortDescription: "description",
          content: "new post content",
          blogId: blog.id,
        });
      }
    });

    it("should sort posts by blogName ascending", async () => {
      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ sortBy: "blogName", sortDirection: "asc", pageSize: 9 });

      // BUG: Sorting by blogName doesn't work correctly
      // Expected alphabetical order: new blog0, new blog1, new blog10, new blog11, new blog2...
      // But note: "new blog10" < "new blog2" in lexicographic order
      // Actual: completely wrong order (new blog8, new blog4, new blog1...)
      expect(response.body.items[0].blogName).toBe("new blog0");
      expect(response.body.items[1].blogName).toBe("new blog1");
      expect(response.body.items[2].blogName).toBe("new blog10");
      expect(response.body.items[3].blogName).toBe("new blog11");
      expect(response.body.items[4].blogName).toBe("new blog2");
    });
  });

  describe("BUG: query params are strings, not numbers", () => {
    beforeEach(async () => {
      // Create 12 posts
      for (let i = 1; i <= 12; i++) {
        await postsTestManager.createEntity({
          title: `Post ${i}`,
          shortDescription: `Desc ${i}`,
          content: `Content ${i}`,
          blogId,
        });
      }
    });

    it("should return page and pageSize as numbers, not strings", async () => {
      const response = await request(app)
        .get(`${ROUTES.posts}`)
        .query({ pageSize: 3, pageNumber: 1 });

      // BUG: page and pageSize are strings like "1" and "3" instead of numbers
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(3);
      expect(response.body.items).toHaveLength(3);
    });
  });
});
