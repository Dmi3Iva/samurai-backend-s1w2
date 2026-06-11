import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import { commentsTestManager } from "./commentsTestManager";
import { ROUTES, VALID_COMMENT_CONTENT } from "./test.const";

describe("DELETE /comments/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const createCommentContext = async () => {
    const user = await usersTestManager.createEntity({
      login: "deleter",
      password: "password123",
      email: "deleter@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "deleter",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Delete Blog",
      description: "Blog for deleting comments",
      websiteUrl: "https://delete-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Delete Post",
      shortDescription: "Short description",
      content: "Post content for deleting",
      blogId: blog.id,
    });

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      VALID_COMMENT_CONTENT,
    );

    return { user, accessToken, post, comment };
  };

  it("should delete own comment with bearer auth", async () => {
    const { accessToken, comment } = await createCommentContext();

    await commentsTestManager.deleteEntity(comment.id, accessToken);

    await commentsTestManager.getEntity(comment.id, 404);
  });

  it("should return 401 without authorization", async () => {
    const { comment } = await createCommentContext();

    const response = await request(app).delete(
      `${ROUTES.comments}/${comment.id}`,
    );

    expect(response.status).toBe(401);
  });

  it("should return 401 with basic auth instead of bearer", async () => {
    const { comment } = await createCommentContext();

    const response = await request(app)
      .delete(`${ROUTES.comments}/${comment.id}`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" });

    expect(response.status).toBe(401);
  });

  it("should return 403 when deleting another users comment", async () => {
    const { comment } = await createCommentContext();

    await usersTestManager.createEntity({
      login: "otherdeler",
      password: "password123",
      email: "otherdeleter@example.com",
    });

    const otherAccessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "otherdeler",
      password: "password123",
    });

    await commentsTestManager.deleteEntity(comment.id, otherAccessToken, 403);

    await commentsTestManager.getEntity(comment.id);
  });

  it("should return 404 when comment does not exist", async () => {
    const { accessToken } = await createCommentContext();

    await commentsTestManager.deleteEntity(
      "507f1f77bcf86cd799439011",
      accessToken,
      404,
    );
  });
});
