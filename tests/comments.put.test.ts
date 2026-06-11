import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import { commentsTestManager } from "./commentsTestManager";
import {
  ROUTES,
  bearerAuthHeader,
  VALID_COMMENT_CONTENT,
} from "./test.const";

describe("PUT /comments/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const createCommentContext = async () => {
    const user = await usersTestManager.createEntity({
      login: "editor",
      password: "password123",
      email: "editor@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "editor",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Edit Blog",
      description: "Blog for editing comments",
      websiteUrl: "https://edit-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Edit Post",
      shortDescription: "Short description",
      content: "Post content for editing",
      blogId: blog.id,
    });

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      VALID_COMMENT_CONTENT,
    );

    return { user, accessToken, post, comment };
  };

  it("should update own comment with bearer auth", async () => {
    const { accessToken, comment } = await createCommentContext();
    const updatedContent = "Updated comment with valid length";

    await commentsTestManager.updateEntity(
      comment.id,
      accessToken,
      updatedContent,
    );

    const updatedComment = await commentsTestManager.getEntity(comment.id);

    expect(updatedComment).toEqual({
      id: comment.id,
      content: updatedContent,
      commentatorInfo: comment.commentatorInfo,
      createdAt: expect.any(String),
    });
  });

  it("should return 401 without authorization", async () => {
    const { comment } = await createCommentContext();

    const response = await request(app)
      .put(`${ROUTES.comments}/${comment.id}`)
      .send({ content: "Updated comment with valid length" });

    expect(response.status).toBe(401);
  });

  it("should return 401 with basic auth instead of bearer", async () => {
    const { comment } = await createCommentContext();

    const response = await request(app)
      .put(`${ROUTES.comments}/${comment.id}`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .send({ content: "Updated comment with valid length" });

    expect(response.status).toBe(401);
  });

  it("should return 403 when updating another users comment", async () => {
    const { comment } = await createCommentContext();

    await usersTestManager.createEntity({
      login: "otheruser",
      password: "password123",
      email: "other@example.com",
    });

    const otherAccessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "otheruser",
      password: "password123",
    });

    await commentsTestManager.updateEntity(
      comment.id,
      otherAccessToken,
      "Updated comment with valid length",
      403,
    );
  });

  it("should return 404 when comment does not exist", async () => {
    const { accessToken } = await createCommentContext();

    await commentsTestManager.updateEntity(
      "507f1f77bcf86cd799439011",
      accessToken,
      "Updated comment with valid length",
      404,
    );
  });

  describe("Input validation", () => {
    it("should return 400 when content is missing", async () => {
      const { accessToken, comment } = await createCommentContext();

      const response = await request(app)
        .put(`${ROUTES.comments}/${comment.id}`)
        .set(bearerAuthHeader(accessToken))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "content",
          }),
        ]),
      );
    });

    it("should return 400 when content is shorter than 20 characters", async () => {
      const { accessToken, comment } = await createCommentContext();

      const response = await request(app)
        .put(`${ROUTES.comments}/${comment.id}`)
        .set(bearerAuthHeader(accessToken))
        .send({ content: "too short" });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "content",
          }),
        ]),
      );
    });

    it("should return 400 when content is longer than 300 characters", async () => {
      const { accessToken, comment } = await createCommentContext();

      const response = await request(app)
        .put(`${ROUTES.comments}/${comment.id}`)
        .set(bearerAuthHeader(accessToken))
        .send({ content: "a".repeat(301) });

      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "content",
          }),
        ]),
      );
    });
  });
});
