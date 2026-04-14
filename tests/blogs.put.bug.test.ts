import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES } from "../src/consants/routes.conts";

describe("PUT /blogs/:id - reproduce bug", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return 404 when blog id doesn't exist", async () => {
    // Создаём блог
    const createResponse = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Test Blog",
        description: "Test Description",
        websiteUrl: "https://test.com",
      });

    expect(createResponse.status).toBe(201);

    // Пробуем обновить с НЕСУЩЕСТВУЮЩИМ id
    const putResponse = await request(app)
      .put(`${ROUTES.blogs}/nonexistentid`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Updated Blog",
        description: "Updated Description",
        websiteUrl: "https://updated.com",
      });

    expect(putResponse.status).toBe(404);
  });

  it("full flow: create -> get -> update -> get with exact id", async () => {
    // 1. Создаём блог
    const createResponse = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Test Blog",
        description: "Test Description",
        websiteUrl: "https://test.com",
      });

    const blogId = createResponse.body.id;

    // 2. GET по id
    const getResponse1 = await request(app).get(`${ROUTES.blogs}/${blogId}`);
    expect(getResponse1.status).toBe(200);

    // 3. PUT обновление
    const putResponse = await request(app)
      .put(`${ROUTES.blogs}/${blogId}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Updated Blog",
        description: "Updated Description",
        websiteUrl: "https://updated.com",
      });

    expect(putResponse.status).toBe(204);

    // 4. GET по id снова
    const getResponse2 = await request(app).get(`${ROUTES.blogs}/${blogId}`);
    expect(getResponse2.status).toBe(200);
  });
});
