import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";

describe("GET /blogs", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should return empty array when no blogs exist", async () => {
    const blogs = await blogsTestManager.getEntities();

    expect(blogs).toEqual([]);
  });

  it("should return all blogs", async () => {
    await blogsTestManager.createEntity({
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
    });

    await blogsTestManager.createEntity({
      name: "Blog 2",
      description: "Desc 2",
      websiteUrl: "https://blog2.com",
    });

    const blogs = await blogsTestManager.getEntities();

    expect(blogs).toHaveLength(2);
    expect(blogs[0].name).toBe("Blog 1");
  });
});
