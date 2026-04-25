import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
import {
  IS_MEMBERSHIP_DEFAULT_VALUE,
  ROUTES,
} from "../src/consants/routes.conts";

describe("DELETE /blogs/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should delete blog by id", async () => {
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

    const blogsBeforeDelete = await blogsTestManager.getEntities();
    const firstBlogId = blogsBeforeDelete[0].id;

    await blogsTestManager.deleteEntity(firstBlogId);

    const blogsAfterDelete = await blogsTestManager.getEntities();
    expect(blogsAfterDelete).toHaveLength(1);
    expect(blogsAfterDelete[0]).toEqual({
      id: expect.any(String),
      name: "Blog 2",
      description: "Desc 2",
      websiteUrl: "https://blog2.com",
      createdAt: expect.any(String),
      isMembership: IS_MEMBERSHIP_DEFAULT_VALUE,
    });
  });

  it("should return 404 when deleting non-existent blog", async () => {
    const error = await blogsTestManager.deleteEntity("999", 404);

    expect(error).toEqual({ message: "Blog not found" });
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).delete(`${ROUTES.blogs}/123`);

    expect(response.status).toBe(401);
  });

  it("should return 404 when deleting same blog twice", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Blog to Delete",
      description: "Description",
      websiteUrl: "https://blog.com",
    });

    await blogsTestManager.deleteEntity(blog.id);

    const error = await blogsTestManager.deleteEntity(blog.id, 404);

    expect(error).toEqual({ message: "Blog not found" });
  });
});
