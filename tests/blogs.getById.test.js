import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
describe("GET /blogs/:id", () => {
    beforeEach(async () => {
        await request(app).delete("/testing/delete-all");
    });
    it("should return blog by id", async () => {
        const createResponse = await blogsTestManager.createEntity({
            name: "Test Blog",
            description: "Test Description",
            websiteUrl: "https://test.com",
        });
        const blogId = createResponse.body.id;
        const response = await blogsTestManager.getEntity(blogId);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(blogId);
        expect(response.body.name).toBe("Test Blog");
    });
    it("should return 404 for non-existent blog", async () => {
        const response = await blogsTestManager.getEntity("999");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Blog not found" });
    });
});
//# sourceMappingURL=blogs.getById.test.js.map