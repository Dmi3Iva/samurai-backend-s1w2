import request from "supertest";
import { app } from "../src/app";
class BlogsTestManager {
    async createEntity(data) {
        const response = await request(app).post("/blogs").send(data);
        return response;
    }
    async deleteEntity(id) {
        const response = await request(app).delete(`/blogs/${id}`);
        return response;
    }
    async getEntity(id) {
        const response = await request(app).get(`/blogs/${id}`);
        return response;
    }
    async getEntities() {
        const response = await request(app).get("/blogs");
        return response;
    }
}
export const blogsTestManager = new BlogsTestManager();
//# sourceMappingURL=blogsTestManager.js.map