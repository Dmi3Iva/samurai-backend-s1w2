import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("GET /blogs - Pagination and Sorting", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  describe("Pagination", () => {
    it("should return default page size (10)", async () => {
      // Create 15 blogs
      for (let i = 1; i <= 15; i++) {
        await blogsTestManager.createEntity({
          name: `Blog ${i}`,
          description: `Description ${i}`,
          websiteUrl: `https://blog${i}.com`,
        });
      }

      const response = await blogsTestManager.getEntities();

      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.totalCount).toBe(15);
      expect(response.items).toHaveLength(10);
    });

    it("should return empty array for page beyond available", async () => {
      await blogsTestManager.createEntity({
        name: "Blog 1",
        description: "Description",
        websiteUrl: "https://blog1.com",
      });

      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ pageNumber: 10, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.totalCount).toBe(1);
    });
  });

  describe("Sorting by createdAt", () => {
    beforeEach(async () => {
      await blogsTestManager.createEntity({
        name: "First Blog",
        description: "Description 1",
        websiteUrl: "https://first.com",
      });

      await blogsTestManager.createEntity({
        name: "Second Blog",
        description: "Description 2",
        websiteUrl: "https://second.com",
      });

      await blogsTestManager.createEntity({
        name: "Third Blog",
        description: "Description 3",
        websiteUrl: "https://third.com",
      });
    });

    it("should sort by createdAt ascending (oldest first)", async () => {
      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ sortBy: "createdAt", sortDirection: "asc" });

      expect(response.status).toBe(200);
      expect(response.body.items[0].name).toBe("First Blog");
      expect(response.body.items[2].name).toBe("Third Blog");
    });

    it("should sort by createdAt descending (newest first) - default", async () => {
      const response = await request(app).get(`${ROUTES.blogs}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });
  });

  describe("Search by name term", () => {
    beforeEach(async () => {
      await blogsTestManager.createEntity({
        name: "Ivan",
        description: "About Ivan",
        websiteUrl: "https://ivan.com",
      });

      await blogsTestManager.createEntity({
        name: "DiVan",
        description: "About DiVan",
        websiteUrl: "https://divan.com",
      });

      await blogsTestManager.createEntity({
        name: "JanClod Vandam",
        description: "About JanClod",
        websiteUrl: "https://janclod.com",
      });

      await blogsTestManager.createEntity({
        name: "Peter Blog",
        description: "About Peter",
        websiteUrl: "https://peter.com",
      });
    });

    it("should search by name substring", async () => {
      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ searchNameTerm: "Ivan" });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      const names = response.body.items.map((b: any) => b.name);
      expect(names.some((n: string) => n.includes("Ivan"))).toBe(true);
    });

    it("should return all blogs when searchNameTerm is not provided", async () => {
      const response = await request(app).get(`${ROUTES.blogs}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(4);
    });
  });

  describe("BUG: searchNameTerm with pagination", () => {
    beforeEach(async () => {
      // Create blogs with similar names for search testing
      await blogsTestManager.createEntity({
        name: "Tim",
        description: "description",
        websiteUrl: "https://someurl.com",
      });

      await blogsTestManager.createEntity({
        name: "Tima",
        description: "description",
        websiteUrl: "https://someurl.com",
      });

      await blogsTestManager.createEntity({
        name: "Timma",
        description: "description",
        websiteUrl: "https://someurl.com",
      });

      await blogsTestManager.createEntity({
        name: "timm",
        description: "description",
        websiteUrl: "https://someurl.com",
      });

      // Create other blogs that shouldn't match
      for (let i = 1; i <= 8; i++) {
        await blogsTestManager.createEntity({
          name: `Other Blog ${i}`,
          description: "description",
          websiteUrl: "https://someurl.com",
        });
      }
    });

    it("should filter by searchNameTerm and return correct totalCount", async () => {
      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ searchNameTerm: "Tim", pageSize: 5, pageNumber: 1 });

      // BUG: searchNameTerm doesn't filter correctly
      // Expected: totalCount = 4 (only blogs with "Tim" in name)
      // Actual: totalCount = 12 (all blogs)
      expect(response.body.totalCount).toBe(4);
      expect(response.body.items).toHaveLength(4);
    });

    it("should return correct pagesCount when filtering by searchNameTerm", async () => {
      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ searchNameTerm: "Tim", pageSize: 5, pageNumber: 1 });

      // BUG: pagesCount is calculated based on total count instead of filtered count
      // Expected: pagesCount = 1 (4 items / 5 per page = 1)
      // Actual: pagesCount = 3 (12 items / 5 per page = 2.4 -> 3)
      expect(response.body.pagesCount).toBe(1);
    });
  });

  describe("BUG: incorrect sort order", () => {
    it("should return blogs in correct order (newest first by createdAt)", async () => {
      // Create 12 blogs
      for (let i = 1; i <= 12; i++) {
        await blogsTestManager.createEntity({
          name: `Blog ${i}`,
          description: `Description ${i}`,
          websiteUrl: `https://blog${i}.com`,
        });
      }

      const response = await request(app).get(`${ROUTES.blogs}`);

      // BUG: Order is incorrect - oldest first instead of newest first
      // Expected: Blog 12, Blog 11, Blog 10... (newest first)
      // Actual: Blog 1, Blog 2, Blog 3... (oldest first)
      expect(response.body.items[0].name).toBe("Blog 12");
      expect(response.body.items[9].name).toBe("Blog 3");
    });
  });

  describe("BUG: pagesCount calculation", () => {
    it("should return correct pagesCount", async () => {
      // Create 12 blogs
      for (let i = 1; i <= 12; i++) {
        await blogsTestManager.createEntity({
          name: `Blog ${i}`,
          description: `Description ${i}`,
          websiteUrl: `https://blog${i}.com`,
        });
      }

      const response = await request(app)
        .get(`${ROUTES.blogs}`)
        .query({ pageSize: 10 });

      // BUG: pagesCount is 0 instead of 2
      expect(response.body.pagesCount).toBe(2);
      expect(response.body.totalCount).toBe(12);
    });
  });
});
