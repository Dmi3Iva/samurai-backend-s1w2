import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import {
  commentsTestManager,
  DEFAULT_LIKES_INFO,
  expectCommentView,
} from "./commentsTestManager";
import {
  ROUTES,
  bearerAuthHeader,
  VALID_COMMENT_CONTENT,
} from "./test.const";

describe("POST /posts/:postId/comments", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const createPostWithUser = async () => {
    const user = await usersTestManager.createEntity({
      login: "commenter",
      password: "password123",
      email: "commenter@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "commenter",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Comments Blog",
      description: "Blog for comments",
      websiteUrl: "https://comments-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Post for comments",
      shortDescription: "Short description",
      content: "Post content for comments",
      blogId: blog.id,
    });

    return { user, accessToken, post };
  };

  it("should create new comment with bearer auth", async () => {
    const { user, accessToken, post } = await createPostWithUser();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    expectCommentView(comment, {
      content: VALID_COMMENT_CONTENT,
      commentatorInfo: {
        userId: user.id,
        userLogin: "commenter",
      },
      likesInfo: DEFAULT_LIKES_INFO,
    });
  });

  it("should return 401 without authorization", async () => {
    const { post } = await createPostWithUser();

    const response = await request(app)
      .post(`${ROUTES.posts}/${post.id}/comments`)
      .send({ content: VALID_COMMENT_CONTENT });

    expect(response.status).toBe(401);
  });

  it("should return 401 with basic auth instead of bearer", async () => {
    const { post } = await createPostWithUser();

    const response = await request(app)
      .post(`${ROUTES.posts}/${post.id}/comments`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .send({ content: VALID_COMMENT_CONTENT });

    expect(response.status).toBe(401);
  });

  it("should return 404 when post does not exist", async () => {
    const { accessToken } = await createPostWithUser();

    await commentsTestManager.createEntity(
      "507f1f77bcf86cd799439011",
      accessToken,
      VALID_COMMENT_CONTENT,
      404,
    );
  });

  describe("Input validation", () => {
    it("should return 400 when content is missing", async () => {
      const { accessToken, post } = await createPostWithUser();

      const response = await request(app)
        .post(`${ROUTES.posts}/${post.id}/comments`)
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
      const { accessToken, post } = await createPostWithUser();

      const response = await request(app)
        .post(`${ROUTES.posts}/${post.id}/comments`)
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
      const { accessToken, post } = await createPostWithUser();

      const response = await request(app)
        .post(`${ROUTES.posts}/${post.id}/comments`)
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
