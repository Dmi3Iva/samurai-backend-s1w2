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
} from "./commentsTestManager";
import {
  ROUTES,
  HOMEWORK_USER,
  VALID_COMMENT_CONTENT,
  bearerAuthHeader,
} from "./test.const";
import { homeworkState } from "./homeworkState";

describe("Homework 6 — Comments for posts with auth (remote checker parity)", () => {
  beforeEach(async () => {
    homeworkState.clearAccessToken();
    await request(app).delete(`${ROUTES.testings}`);

    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const accessToken = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    homeworkState.setAccessToken(accessToken);
  });

  const createBlogAndPost = async () => {
    const blog = await blogsTestManager.createEntity({
      name: "hw blog",
      description: "homework blog",
      websiteUrl: "https://hw-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "hw post",
      shortDescription: "homework post",
      content: "homework post content",
      blogId: blog.id,
    });

    return { blog, post };
  };

  it("POST /posts/:postId/comments: should create new comment; status 201", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    expect(comment).toEqual({
      id: expect.any(String),
      content: VALID_COMMENT_CONTENT,
      commentatorInfo: {
        userId: expect.any(String),
        userLogin: HOMEWORK_USER.login,
      },
      createdAt: expect.any(String),
      likesInfo: DEFAULT_LIKES_INFO,
    });

    const fetched = await commentsTestManager.getEntity(comment.id);
    expect(fetched.id).toBe(comment.id);
  });

  it("PUT /comments/:commentId: should update comment by id; status 204", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();
    const updatedContent = "Updated homework comment text";

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    await commentsTestManager.updateEntity(
      comment.id,
      accessToken,
      updatedContent,
    );

    const updated = await commentsTestManager.getEntity(comment.id);
    expect(updated.content).toBe(updatedContent);
  });

  it("GET /posts/:postId/comments: should return status 200; content: comments with pagination", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    const comments = await commentsTestManager.getEntitiesForPost(post.id);

    expect(comments).toEqual({
      items: [
        {
          id: comment.id,
          content: VALID_COMMENT_CONTENT,
          commentatorInfo: comment.commentatorInfo,
          createdAt: expect.any(String),
          likesInfo: DEFAULT_LIKES_INFO,
        },
      ],
      page: 1,
      pageSize: 10,
      pagesCount: 1,
      totalCount: 1,
    });
  });

  it("GET /comments/:id: should return status 200; content: comment by id", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const created = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    const comment = await commentsTestManager.getEntity(created.id);

    expect(comment).toEqual({
      id: created.id,
      content: VALID_COMMENT_CONTENT,
      commentatorInfo: created.commentatorInfo,
      createdAt: expect.any(String),
      likesInfo: DEFAULT_LIKES_INFO,
    });
  });

  it("DELETE /comments/:id: should delete comment by id; status 204", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    await commentsTestManager.deleteEntity(comment.id, accessToken);
    await commentsTestManager.getEntity(comment.id, 404);
  });

  it("should return 404 if :id from uri param not found", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();
    const fakeId = "507f1f77bcf86cd799439011";

    await commentsTestManager.getEntity(fakeId, 404);

    await request(app)
      .post(`${ROUTES.posts}/${post.id}/comments`)
      .set(bearerAuthHeader(accessToken))
      .send({ content: VALID_COMMENT_CONTENT })
      .expect(201);

    await commentsTestManager.deleteEntity(fakeId, accessToken, 404);
    await commentsTestManager.updateEntity(
      fakeId,
      accessToken,
      "Updated comment with valid length",
      404,
    );

    await request(app)
      .get(`${ROUTES.posts}/${fakeId}/comments`)
      .expect(404);
  });

  it("should return 401 if auth credentials is incorrect", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    await request(app)
      .post(`${ROUTES.posts}/${post.id}/comments`)
      .send({ content: VALID_COMMENT_CONTENT })
      .expect(401);

    await request(app)
      .put(`${ROUTES.comments}/${comment.id}`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .send({ content: "Updated comment with valid length" })
      .expect(401);

    await request(app)
      .delete(`${ROUTES.comments}/${comment.id}`)
      .set(bearerAuthHeader("invalid.token.value"))
      .expect(401);
  });

  it("should return 403 if access denied for PUT and DELETE", async () => {
    const accessToken = homeworkState.getAccessToken();
    const { post } = await createBlogAndPost();

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    await usersTestManager.createEntity({
      login: "other-hw",
      password: "password123",
      email: "other-hw@example.com",
    });

    const otherToken = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: "other-hw",
      password: "password123",
    });

    await commentsTestManager.updateEntity(
      comment.id,
      otherToken,
      "Updated comment with valid length",
      403,
    );

    await commentsTestManager.deleteEntity(comment.id, otherToken, 403);
  });
});

describe("Homework 6 — Comments body validation (remote checker parity)", () => {
  beforeEach(async () => {
    homeworkState.clearAccessToken();
    await request(app).delete(`${ROUTES.testings}`);

    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    homeworkState.setAccessToken(
      await authTestManager.loginAndGetTokenHomework({
        loginOrEmail: HOMEWORK_USER.login,
        password: HOMEWORK_USER.password,
      }),
    );
  });

  it('POST /posts/:postId/comments: should return 400 if body is incorrect', async () => {
    const accessToken = homeworkState.getAccessToken();

    const blog = await blogsTestManager.createEntity({
      name: "valid blog",
      description: "description",
      websiteUrl: "https://valid-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "valid post",
      shortDescription: "short",
      content: "content",
      blogId: blog.id,
    });

    const response = await request(app)
      .post(`${ROUTES.posts}/${post.id}/comments`)
      .set(bearerAuthHeader(accessToken))
      .send({ content: "short" });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "content" }),
      ]),
    );
  });

  it('PUT /comments/:commentId: should return 400 if body is incorrect', async () => {
    const accessToken = homeworkState.getAccessToken();

    const blog = await blogsTestManager.createEntity({
      name: "valid blog",
      description: "description",
      websiteUrl: "https://valid-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "valid post",
      shortDescription: "short",
      content: "content",
      blogId: blog.id,
    });

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    const response = await request(app)
      .put(`${ROUTES.comments}/${comment.id}`)
      .set(bearerAuthHeader(accessToken))
      .send({ content: "short" });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "content" }),
      ]),
    );
  });
});
