import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { postsTestManager } from "./postsTestManager";
import { blogsTestManager } from "./blogsTestManager";

describe("POST /posts", () => {
  beforeEach(async () => {
    await request(app).delete("/testing/delete-all");
  });

  it("should create new post", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "New Blog",
      description: "New Description",
      websiteUrl: "https://newblog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "New Post",
      shortDescription: "New Short Description",
      content: "New Content",
      blogId: blog.id,
      blogName: "New Blog",
    });

    expect(post).toHaveProperty("id");
    expect(post.title).toBe("New Post");
    expect(post.shortDescription).toBe("New Short Description");
    expect(post.content).toBe("New Content");
    expect(post.blogId).toBe(blog.id);
  });

  it("should return 401 without authorization", async () => {
    const response = await request(app).post("/posts").send({
      title: "Post",
      shortDescription: "Desc",
      content: "Content",
      blogId: "some-id",
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 when blog does not exist", async () => {
    const error = await postsTestManager.createEntity(
      {
        title: "Post",
        shortDescription: "Desc",
        content: "Content",
        blogId: "non-existent-blog-id",
        blogName: "Blog",
      },
      400,
    );

    expect(error).toContain("There is no blog with id");
  });

  it("should return 400 when missing required fields", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "Only Title",
      });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should save post to db", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Saved Blog",
      description: "Saved Description",
      websiteUrl: "https://saved.com",
    });

    await postsTestManager.createEntity({
      title: "Saved Post",
      shortDescription: "Saved Short Desc",
      content: "Saved Content",
      blogId: blog.id,
      blogName: "Saved Blog",
    });

    const posts = await postsTestManager.getEntities();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe("Saved Post");
  });
});
