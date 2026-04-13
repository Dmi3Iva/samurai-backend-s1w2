import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";

describe("DELETE /blogs/:id", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
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
    expect(blogsAfterDelete[0].name).toBe("Blog 2");
  });

  it("should return 404 when deleting non-existent blog", async () => {
    const error = await blogsTestManager.deleteEntity("999", 404);

    expect(error).toEqual({ message: "Blog not found" });
  });
});
