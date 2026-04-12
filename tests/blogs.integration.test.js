import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { blogsTestManager } from "./blogsTestManager";
describe("Blogs Integration Tests", () => {
    beforeEach(async () => {
        await request(app).delete("/testing/delete-all");
    });
    it("should handle full blog lifecycle", async () => {
        // Create
        const createResponse = await blogsTestManager.createEntity({
            name: "Test Blog",
            description: "Test Description",
            websiteUrl: "https://test.com",
        });
        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toHaveProperty("id");
        const blogId = createResponse.body.id;
        // Get all
        const getAllResponse = await blogsTestManager.getEntities();
        expect(getAllResponse.status).toBe(200);
        expect(getAllResponse.body).toHaveLength(1);
        // Get by id
        const getByIdResponse = await blogsTestManager.getEntity(blogId);
        expect(getByIdResponse.status).toBe(200);
        expect(getByIdResponse.body.id).toBe(blogId);
        // Delete
        const deleteResponse = await blogsTestManager.deleteEntity(blogId);
        expect(deleteResponse.status).toBe(204);
        // Verify deleted
        const verifyResponse = await blogsTestManager.getEntity(blogId);
        expect(verifyResponse.status).toBe(404);
    });
});
//# sourceMappingURL=blogs.integration.test.js.map