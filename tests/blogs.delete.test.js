import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { blogsTestManager } from "./blogsTestManager";
describe("DELETE /blogs/:id", () => {
    beforeEach(async () => {
        await request(await import("../src/app")).then(m => request(m.app)).delete("/testing/delete-all");
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
        const firstBlogId = blogsBeforeDelete.body[0].id;
        const response = await blogsTestManager.deleteEntity(firstBlogId);
        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
        const blogsAfterDelete = await blogsTestManager.getEntities();
        expect(blogsAfterDelete.body).toHaveLength(1);
        expect(blogsAfterDelete.body[0].name).toBe("Blog 2");
    });
    it("should return 404 when deleting non-existent blog", async () => {
        const response = await blogsTestManager.deleteEntity("999");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Blog not found" });
    });
});
//# sourceMappingURL=blogs.delete.test.js.map