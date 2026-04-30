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
});
