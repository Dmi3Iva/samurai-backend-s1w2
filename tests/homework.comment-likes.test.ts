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

describe("Homework 11 — Comment likes (remote checker parity)", () => {
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

  const createBlogPostAndComment = async () => {
    const accessToken = homeworkState.getAccessToken();

    const blog = await blogsTestManager.createEntity({
      name: "hw likes blog",
      description: "homework likes blog",
      websiteUrl: "https://hw-likes-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "hw likes post",
      shortDescription: "homework likes post",
      content: "homework likes post content",
      blogId: blog.id,
    });

    const comment = await commentsTestManager.createEntity(
      post.id,
      accessToken,
    );

    return { blog, post, comment, accessToken };
  };

  const createSecondUserToken = async (
    login = "liker-2",
    password = "password123",
    email = "liker2@example.com",
  ) => {
    await usersTestManager.createEntity({ login, password, email });
    return authTestManager.loginAndGetTokenHomework({
      loginOrEmail: login,
      password,
    });
  };

  it("POST comment: should return likesInfo with defaults; status 201", async () => {
    const { comment } = await createBlogPostAndComment();

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
  });

  it("GET /comments/:id: should return likesInfo defaults for unauthorized user", async () => {
    const { comment } = await createBlogPostAndComment();

    const fetched = await commentsTestManager.getEntity(comment.id);

    expect(fetched.likesInfo).toEqual(DEFAULT_LIKES_INFO);
  });

  it("PUT /comments/:commentId/like-status: should like comment; status 204", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );

    const fetched = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );

    expect(fetched.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "Like",
    });
  });

  it("PUT like-status: should dislike comment; status 204", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Dislike",
    );

    const fetched = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );

    expect(fetched.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "Dislike",
    });
  });

  it("PUT like-status: should switch Like -> Dislike without double counting", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Dislike",
    );

    const fetched = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );

    expect(fetched.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "Dislike",
    });
  });

  it("PUT like-status: should reset status with None", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "None",
    );

    const fetched = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );

    expect(fetched.likesInfo).toEqual(DEFAULT_LIKES_INFO);
  });

  it("PUT like-status: repeating the same status should not change counts", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );

    const fetched = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );

    expect(fetched.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "Like",
    });
  });

  it("should accumulate likes from different users", async () => {
    const { comment, accessToken, post } = await createBlogPostAndComment();
    const secondToken = await createSecondUserToken();

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      secondToken,
      "Like",
    );

    const asFirst = await commentsTestManager.getEntity(
      comment.id,
      200,
      accessToken,
    );
    const asSecond = await commentsTestManager.getEntity(
      comment.id,
      200,
      secondToken,
    );
    const asGuest = await commentsTestManager.getEntity(comment.id);

    expect(asFirst.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: "Like",
    });
    expect(asSecond.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: "Like",
    });
    expect(asGuest.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: "None",
    });

    const list = await commentsTestManager.getEntitiesForPost(
      post.id,
      200,
      accessToken,
    );
    expect(list.items[0].likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: "Like",
    });
  });

  it("should count likes and dislikes independently across users", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();
    const secondToken = await createSecondUserToken();
    const thirdToken = await createSecondUserToken(
      "liker-3",
      "password123",
      "liker3@example.com",
    );

    await commentsTestManager.updateLikeStatus(
      comment.id,
      accessToken,
      "Like",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      secondToken,
      "Dislike",
    );
    await commentsTestManager.updateLikeStatus(
      comment.id,
      thirdToken,
      "Like",
    );

    const asThird = await commentsTestManager.getEntity(
      comment.id,
      200,
      thirdToken,
    );
    const asSecond = await commentsTestManager.getEntity(
      comment.id,
      200,
      secondToken,
    );

    expect(asThird.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 1,
      myStatus: "Like",
    });
    expect(asSecond.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 1,
      myStatus: "Dislike",
    });
  });

  it("should return 401 if auth credentials is incorrect", async () => {
    const { comment } = await createBlogPostAndComment();

    await request(app)
      .put(`${ROUTES.comments}/${comment.id}/like-status`)
      .send({ likeStatus: "Like" })
      .expect(401);

    await request(app)
      .put(`${ROUTES.comments}/${comment.id}/like-status`)
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .send({ likeStatus: "Like" })
      .expect(401);

    await request(app)
      .put(`${ROUTES.comments}/${comment.id}/like-status`)
      .set(bearerAuthHeader("invalid.token.value"))
      .send({ likeStatus: "Like" })
      .expect(401);
  });

  it("should return 404 if comment does not exist", async () => {
    const accessToken = homeworkState.getAccessToken();
    const fakeId = "507f1f77bcf86cd799439011";

    await commentsTestManager.updateLikeStatus(
      fakeId,
      accessToken,
      "Like",
      404,
    );
  });

  it("should return 400 if likeStatus is incorrect", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    const response = await request(app)
      .put(`${ROUTES.comments}/${comment.id}/like-status`)
      .set(bearerAuthHeader(accessToken))
      .send({ likeStatus: "Invalid" });

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "likeStatus" }),
      ]),
    );
  });

  it("should return 400 if likeStatus is missing", async () => {
    const { comment, accessToken } = await createBlogPostAndComment();

    const response = await request(app)
      .put(`${ROUTES.comments}/${comment.id}/like-status`)
      .set(bearerAuthHeader(accessToken))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "likeStatus" }),
      ]),
    );
  });
});
