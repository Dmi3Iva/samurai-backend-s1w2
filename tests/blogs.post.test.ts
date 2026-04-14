import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";

describe("POST /blogs", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should create new blog", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "New Blog",
      description: "New Description",
      websiteUrl: "https://newblog.com",
    });

    expect(blog).toHaveProperty("id");
    expect(blog.name).toBe("New Blog");
    expect(blog.description).toBe("New Description");
    expect(blog.websiteUrl).toBe("https://newblog.com");
  });

  it("should return 400 when missing required fields", async () => {
    const error = await blogsTestManager.createEntity(
      {
        name: "Only Name",
        description: "",
        websiteUrl: "",
      },
      400,
    );

    expect(error).toBeInstanceOf(Array);
    expect(error.length).toBeGreaterThan(0);
  });

  it("should save blog to db", async () => {
    await blogsTestManager.createEntity({
      name: "Saved Blog",
      description: "Saved Description",
      websiteUrl: "https://saved.com",
    });

    const blogs = await blogsTestManager.getEntities();

    expect(blogs).toHaveLength(1);
    expect(blogs[0].name).toBe("Saved Blog");
  });
});
