import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import { commentsTestManager } from "./commentsTestManager";
import { ROUTES, VALID_COMMENT_CONTENT } from "./test.const";

describe("Comments Integration Tests", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should handle full comment lifecycle", async () => {
    const user = await usersTestManager.createEntity({
      login: "lifecycle",
      password: "password123",
      email: "lifecycle@example.com",
    });

    const accessToken = await authTestManager.loginAndGetToken({
      loginOrEmail: "lifecycle",
      password: "password123",
    });

    const me = await authTestManager.getMe(accessToken);
    expect(me.userId).toBe(user.id);

    const blog = await blogsTestManager.createEntity({
      name: "Lifecycle Blog",
      description: "Integration blog",
      websiteUrl: "https://lifecycle-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "Lifecycle Post",
      shortDescription: "Short description",
      content: "Lifecycle content",
      blogId: blog.id,
    });

    const createdComment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      VALID_COMMENT_CONTENT,
    );

    const commentsList = await commentsTestManager.getEntitiesForPost(post.id);
    expect(commentsList.items).toHaveLength(1);
    expect(commentsList.items[0].id).toBe(createdComment.id);

    const commentById = await commentsTestManager.getEntity(createdComment.id);
    expect(commentById.content).toBe(VALID_COMMENT_CONTENT);

    const updatedContent = "Lifecycle updated comment text";
    await commentsTestManager.updateEntity(
      createdComment.id,
      accessToken,
      updatedContent,
    );

    const updatedComment = await commentsTestManager.getEntity(
      createdComment.id,
    );
    expect(updatedComment.content).toBe(updatedContent);

    await commentsTestManager.deleteEntity(createdComment.id, accessToken);
    await commentsTestManager.getEntity(createdComment.id, 404);
  });
});
