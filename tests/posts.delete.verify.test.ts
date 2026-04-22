import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES } from "../src/consants/routes.conts";

describe("Posts DELETE - verify blog is not deleted", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should NOT delete blog when deleting post", async () => {
    // 1. Create blog
    const blogResponse = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Test Blog",
        description: "Test Description",
        websiteUrl: "https://test.com",
      });

    expect(blogResponse.status).toBe(201);
    const blogId = blogResponse.body.id;

    // 2. Create post
    const postResponse = await request(app)
      .post(`${ROUTES.posts}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "Test Post",
        shortDescription: "Short Desc",
        content: "Content",
        blogId: blogId,
      });

    expect(postResponse.status).toBe(201);
    const postId = postResponse.body.id;
    console.log("Created post id:", postId);

    // 3. Verify blog exists before deleting post
    const blogBeforeDelete = await request(app).get(
      `${ROUTES.blogs}/${blogId}`,
    );
    expect(blogBeforeDelete.status).toBe(200);
    console.log("Blog exists before post delete:", blogBeforeDelete.status);

    // 4. Delete post
    const deleteResponse = await request(app)
      .delete(`${ROUTES.posts}/${postId}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5");

    expect(deleteResponse.status).toBe(204);
    console.log("Post deleted, status:", deleteResponse.status);

    // 5. CRITICAL: Verify blog still exists after deleting post
    const blogAfterDelete = await request(app).get(`${ROUTES.blogs}/${blogId}`);
    console.log("Blog exists after post delete:", blogAfterDelete.status);
    console.log("Blog data:", blogAfterDelete.body);

    expect(blogAfterDelete.status).toBe(200);
  });

  it("reproduce the exact test flow: POST blog -> POST post -> GET post -> DELETE post -> verify blog", async () => {
    // POST blog
    const blogResponse = await request(app)
      .post(`${ROUTES.blogs}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        name: "Test Blog",
        description: "Test Description",
        websiteUrl: "https://test.com",
      });

    const blogId = blogResponse.body.id;

    // POST post
    const postResponse = await request(app)
      .post(`${ROUTES.posts}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "post title",
        shortDescription: "description",
        content: "new post content",
        blogId: blogId,
      });

    expect(postResponse.status).toBe(201);
    const postId = postResponse.body.id;

    // GET post
    const getResponse = await request(app).get(`${ROUTES.posts}/${postId}`);
    expect(getResponse.status).toBe(200);

    // DELETE post
    const deleteResponse = await request(app)
      .delete(`${ROUTES.posts}/${postId}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5");

    expect(deleteResponse.status).toBe(204);

    // Now try to create another post with same blogId - this should work!
    const postResponse2 = await request(app)
      .post(`${ROUTES.posts}`)
      .set("Authorization", "Basic YWRtaW46cXdlcnR5")
      .send({
        title: "Another post",
        shortDescription: "description",
        content: "content",
        blogId: blogId,
      });

    console.log("Second post create status:", postResponse2.status);
    console.log("Second post create body:", postResponse2.body);

    // This should be 201, not 404!
    expect(postResponse2.status).toBe(201);
  });
});
