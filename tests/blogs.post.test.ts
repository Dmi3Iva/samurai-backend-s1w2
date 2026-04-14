import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("POST /blogs", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should create new blog", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "New Blog",
      description: "New Description",
      websiteUrl: "https://newblog.com",
    });

    expect(blog).toEqual({
      id: expect.any(String),
      name: "New Blog",
      description: "New Description",
      websiteUrl: "https://newblog.com",
    });
  });

  it("should return 400 when websiteUrl is empty", async () => {
    const error = await blogsTestManager.createEntity(
      {
        name: "Only Name",
        description: "Description",
        websiteUrl: "",
      },
      400,
    );

    expect(error.errorsMessages).toBeInstanceOf(Array);
    expect(error.errorsMessages.length).toBeGreaterThan(0);
  });

  it("should save blog to db", async () => {
    await blogsTestManager.createEntity({
      name: "Saved Blog",
      description: "Saved Description",
      websiteUrl: "https://saved.com",
    });

    const blogs = await blogsTestManager.getEntities();

    expect(blogs).toHaveLength(1);
    expect(blogs[0]).toEqual({
      id: expect.any(String),
      name: "Saved Blog",
      description: "Saved Description",
      websiteUrl: "https://saved.com",
    });
  });

  it("should return validation errors for all missing fields", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toBeInstanceOf(Array);
    expect(response.body.errorsMessages).toHaveLength(3);
  });

  it("should return validation error when name exceeds max length", async () => {
    const error = await blogsTestManager.createEntity(
      {
        name: "a".repeat(16),
        description: "Description",
        websiteUrl: "https://blog.com",
      },
      400,
    );

    expect(error.errorsMessages).toBeInstanceOf(Array);
    expect(error.errorsMessages.length).toBeGreaterThan(0);
  });

  it("should return validation error when websiteUrl exceeds max length", async () => {
    // https:// (8 chars) + domain + .com (4 chars) = total, max is 100
    // domain can be max 88 chars
    const error = await blogsTestManager.createEntity(
      {
        name: "Blog",
        description: "Description",
        websiteUrl: `https://${"a".repeat(89)}.com`,
      },
      400,
    );

    expect(error.errorsMessages).toBeInstanceOf(Array);
    expect(error.errorsMessages.length).toBeGreaterThan(0);
  });

  it("should accept websiteUrl with valid regex pattern", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Valid Url Blog",
      description: "Description",
      websiteUrl: "https://my-test-blog.com/path/to/resource",
    });

    expect(blog.websiteUrl).toBe("https://my-test-blog.com/path/to/resource");
  });

  it("should return 401 with Bearer authorization (only Basic is supported)", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Bearer YWRtaW46cXdlcnR5")
      .send({
        name: "Blog",
        description: "Description",
        websiteUrl: "https://blog.com",
      });

    expect(response.status).toBe(401);
  });

  it("should reject websiteUrl with invalid regex pattern", async () => {
    const error = await blogsTestManager.createEntity(
      {
        name: "Invalid Url Blog",
        description: "Description",
        websiteUrl: "http://not-https.com",
      },
      400,
    );

    expect(error.errorsMessages).toBeInstanceOf(Array);
    expect(error.errorsMessages.length).toBeGreaterThan(0);
  });
});
