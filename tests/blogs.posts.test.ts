import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { ROUTES } from "../src/consants/routes.conts";

describe("POST /blogs/:blogId/posts", () => {
  let blogId: string;

  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);

    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });
    blogId = blog.id;
  });

  it("should create post for specific blog", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}/${blogId}/posts`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "New Post",
        shortDescription: "New Short Desc",
        content: "New Content",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      title: "New Post",
      shortDescription: "New Short Desc",
      content: "New Content",
      blogId,
      blogName: "Test Blog",
      createdAt: expect.any(String),
    });
  });

  it("should return 404 when blog does not exist", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}/nonexistentid/posts`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "New Post",
        shortDescription: "Desc",
        content: "Content",
      });

    expect(response.status).toBe(404);
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}/${blogId}/posts`)
      .send({
        title: "New Post",
        shortDescription: "Desc",
        content: "Content",
      });

    expect(response.status).toBe(401);
  });

  it("should validate post data", async () => {
    const response = await request(app)
      .post(`${ROUTES.blogs}/${blogId}/posts`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "",
        shortDescription: "",
        content: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toBeInstanceOf(Array);
  });

  it("should create post and make it available via GET /posts", async () => {
    await request(app)
      .post(`${ROUTES.blogs}/${blogId}/posts`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "New Post",
        shortDescription: "Desc",
        content: "Content",
      });

    const posts = await postsTestManager.getEntities();

    expect(posts.items).toHaveLength(1);
    expect(posts.items[0].title).toBe("New Post");
  });
});

describe("GET /blogs/:id/posts", () => {
  let blogId: string;
  let blog2Id: string;

  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);

    const blog = await blogsTestManager.createEntity({
      name: "Test Blog",
      description: "Test Description",
      websiteUrl: "https://test.com",
    });
    blogId = blog.id;

    const blog2 = await blogsTestManager.createEntity({
      name: "Another Blog",
      description: "Another Description",
      websiteUrl: "https://another.com",
    });
    blog2Id = blog2.id;
  });

  it("should return posts for specific blog", async () => {
    await postsTestManager.createEntity({
      title: "Blog Post 1",
      shortDescription: "Desc 1",
      content: "Content 1",
      blogId,
    });

    await postsTestManager.createEntity({
      title: "Blog Post 2",
      shortDescription: "Desc 2",
      content: "Content 2",
      blogId,
    });

    await postsTestManager.createEntity({
      title: "Other Blog Post",
      shortDescription: "Desc",
      content: "Content",
      blogId: blog2Id,
    });

    const response = await request(app).get(`${ROUTES.blogs}/${blogId}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.every((p: any) => p.blogId === blogId)).toBe(
      true,
    );
  });

  it("should return empty array when blog has no posts", async () => {
    const response = await request(app).get(`${ROUTES.blogs}/${blogId}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
    expect(response.body.totalCount).toBe(0);
  });

  it("should support sorting for blog posts by createdAt", async () => {
    await postsTestManager.createEntity({
      title: "First Post",
      shortDescription: "Desc 1",
      content: "Content 1",
      blogId,
    });

    await postsTestManager.createEntity({
      title: "Second Post",
      shortDescription: "Desc 2",
      content: "Content 2",
      blogId,
    });

    await postsTestManager.createEntity({
      title: "Third Post",
      shortDescription: "Desc 3",
      content: "Content 3",
      blogId,
    });

    const response = await request(app)
      .get(`${ROUTES.blogs}/${blogId}/posts`)
      .query({ sortBy: "createdAt", sortDirection: "desc" });

    expect(response.status).toBe(200);
    expect(response.body.items[0].title).toBe("Third Post");
  });
});
