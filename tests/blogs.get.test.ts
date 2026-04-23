import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import { IS_MEMBERSHIP_DEFAULT_VALUE, ROUTES } from "../src/consants/routes.conts";

describe("GET /blogs", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
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
    expect(blogs[0]).toEqual({
      id: expect.any(String),
      name: "Blog 1",
      description: "Desc 1",
      websiteUrl: "https://blog1.com",
      createdAt: expect.any(String),
      isMembership: IS_MEMBERSHIP_DEFAULT_VALUE,
    });
    expect(blogs[1]).toEqual({
      id: expect.any(String),
      name: "Blog 2",
      description: "Desc 2",
      websiteUrl: "https://blog2.com",
      createdAt: expect.any(String),
      isMembership: IS_MEMBERSHIP_DEFAULT_VALUE,
    });
  });
});
