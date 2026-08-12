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
import { ROUTES, VALID_COMMENT_CONTENT } from "./test.const";

describe("GET /posts/:postId/comments", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return comments for existing post", async () => {
    await usersTestManager.createEntity({
      login: "reader",
      password: "password123",
      email: "reader@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "reader",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Read Blog",
      description: "Blog description",
      websiteUrl: "https://read-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Readable Post",
      shortDescription: "Short description",
      content: "Readable content",
      blogId: blog.id,
    });

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      VALID_COMMENT_CONTENT,
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

  it("should return empty list when post has no comments", async () => {
    const blog = await blogsTestManager.createEntity({
      name: "Empty Blog",
      description: "Blog description",
      websiteUrl: "https://empty-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Empty Post",
      shortDescription: "Short description",
      content: "Empty content",
      blogId: blog.id,
    });

    const comments = await commentsTestManager.getEntitiesForPost(post.id);

    expect(comments.items).toHaveLength(0);
    expect(comments.totalCount).toBe(0);
  });

  it("should return 404 when post does not exist", async () => {
    await commentsTestManager.getEntitiesForPost(
      "507f1f77bcf86cd799439011",
      404,
    );
  });

  it("should support pagination query params", async () => {
    await usersTestManager.createEntity({
      login: "paginator",
      password: "password123",
      email: "paginator@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "paginator",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Page Blog",
      description: "Blog description",
      websiteUrl: "https://page-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Paged Post",
      shortDescription: "Short description",
      content: "Paged content",
      blogId: blog.id,
    });

    await commentsTestManager.createEntity(
      post.id,
      accessToken,
      "First comment with enough length",
    );
    await commentsTestManager.createEntity(
      post.id,
      accessToken,
      "Second comment with enough length",
    );

    const response = await request(app)
      .get(`${ROUTES.posts}/${post.id}/comments`)
      .query({ pageNumber: 1, pageSize: 1 });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.pageSize).toBe(1);
    expect(response.body.totalCount).toBe(2);
    expect(response.body.pagesCount).toBe(2);
  });
});
