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
import { ROUTES, VALID_COMMENT_CONTENT } from "./test.const";

describe("GET /comments/:id", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should return comment by id", async () => {
    await usersTestManager.createEntity({
      login: "getter",
      password: "password123",
      email: "getter@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "getter",
      password: "password123",
    });

    const blog = await blogsTestManager.createEntity({
      name: "Get Blog",
      description: "Blog description",
      websiteUrl: "https://get-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Get Post",
      shortDescription: "Short description",
      content: "Get content",
      blogId: blog.id,
    });

    const createdComment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      VALID_COMMENT_CONTENT,
    );

    const comment = await commentsTestManager.getEntity(createdComment.id);

    expectCommentView(comment, {
      id: createdComment.id,
      content: VALID_COMMENT_CONTENT,
      commentatorInfo: createdComment.commentatorInfo,
      likesInfo: DEFAULT_LIKES_INFO,
    });
  });

  it("should return 404 for non-existent comment", async () => {
    await commentsTestManager.getEntity("507f1f77bcf86cd799439011", 404);
  });
});
