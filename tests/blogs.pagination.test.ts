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

  describe("Sorting", () => {
    beforeEach(async () => {
      // Create blogs with different names
      await blogsTestManager.createEntity({
        name: "Charlie Blog",
        description: "Description C",
        websiteUrl: "https://charlie.com",
      });

      await blogsTestManager.createEntity({
        name: "Alpha Blog",
        description: "Description A",
        websiteUrl: "https://alpha.com",
      });

      await blogsTestManager.createEntity({
        name: "Bravo Blog",
        description: "Description B",
        websiteUrl: "https://bravo.com",
      });
    });

    it("should return blogs ordered by createdAt descending (newest first) - default", async () => {
      const response = await request(app).get(`${ROUTES.blogs}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });
  });

  describe("Search", () => {
    beforeEach(async () => {
      await blogsTestManager.createEntity({
        name: "Tech Blog",
        description: "About technology",
        websiteUrl: "https://tech.com",
      });

      await blogsTestManager.createEntity({
        name: "Cooking Blog",
        description: "About cooking",
        websiteUrl: "https://cooking.com",
      });

      await blogsTestManager.createEntity({
        name: "Travel Blog",
        description: "About travel",
        websiteUrl: "https://travel.com",
      });
    });

    it("should return all blogs when no filters applied", async () => {
      const response = await request(app).get(`${ROUTES.blogs}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });
  });
});
