import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
describe("POST /blogs", () => {
    beforeEach(async () => {
        await request(app).delete("/testing/delete-all");
    });
    it("should create new blog", async () => {
        const newBlog = {
            name: "New Blog",
            description: "New Description",
            websiteUrl: "https://newblog.com",
        };
        const response = await request(app).post("/blogs").send(newBlog);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("New Blog");
        expect(response.body.description).toBe("New Description");
        expect(response.body.websiteUrl).toBe("https://newblog.com");
    });
    it("should return 400 when missing required fields", async () => {
        const response = await request(app).post("/blogs").send({ name: "Only Name" });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Missing required fields" });
    });
    it("should save blog to db", async () => {
        const newBlog = {
            name: "Saved Blog",
            description: "Saved Description",
            websiteUrl: "https://saved.com",
        };
        await request(app).post("/blogs").send(newBlog);
        const response = await request(app).get("/blogs");
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe("Saved Blog");
    });
});
//# sourceMappingURL=blogs.post.test.js.map