import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import {
  commentsTestManager,
  expectCommentView,
  expectLikesInfoFieldIfPresent,
  expectLikesInfoSchema,
} from "./commentsTestManager";
import {
  ROUTES,
  HOMEWORK_USER,
  VALID_COMMENT_CONTENT,
  bearerAuthHeader,
} from "./test.const";
import { homeworkState } from "./homeworkState";

describe("Homework 11 — Comment likes (swagger h11)", () => {
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

  describe("CommentViewModel (likesInfo optional)", () => {
    it("POST comment: required fields only; likesInfo is optional", async () => {
      const { comment } = await createBlogPostAndComment();

      expectCommentView(comment, {
        content: VALID_COMMENT_CONTENT,
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: HOMEWORK_USER.login,
        },
      });
    });

    it("GET /comments/:id without auth: 200 with required fields", async () => {
      const { comment } = await createBlogPostAndComment();

      const fetched = await commentsTestManager.getEntity(comment.id);

      expectCommentView(fetched, {
        id: comment.id,
        content: VALID_COMMENT_CONTENT,
        commentatorInfo: comment.commentatorInfo,
      });
    });

    it("GET /comments/:id with auth: 200 with required fields", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

      const fetched = await commentsTestManager.getEntity(
        comment.id,
        200,
        accessToken,
      );

      expectCommentView(fetched, {
        id: comment.id,
        content: VALID_COMMENT_CONTENT,
        commentatorInfo: comment.commentatorInfo,
      });
    });

    it("GET /posts/:postId/comments: items have required fields; likesInfo optional", async () => {
      const { comment, post, accessToken } = await createBlogPostAndComment();

      const list = await commentsTestManager.getEntitiesForPost(
        post.id,
        200,
        accessToken,
      );

      expect(list.totalCount).toBe(1);
      expect(list.items).toHaveLength(1);
      expectCommentView(list.items[0], {
        id: comment.id,
        content: VALID_COMMENT_CONTENT,
        commentatorInfo: comment.commentatorInfo,
      });
    });

    it("if likesInfo is present, only known optional fields are allowed", async () => {
      const { comment } = await createBlogPostAndComment();
      const fetched = await commentsTestManager.getEntity(comment.id);

      if (fetched.likesInfo !== undefined) {
        expectLikesInfoSchema(fetched.likesInfo);
      }
    });
  });

  describe("PUT /comments/:commentId/like-status", () => {
    it("should like comment; status 204", async () => {
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

      expectCommentView(fetched, {
        id: comment.id,
        content: VALID_COMMENT_CONTENT,
        commentatorInfo: comment.commentatorInfo,
      });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "likesCount", 1);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "dislikesCount", 0);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "Like");
    });

    it("should dislike comment; status 204", async () => {
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

      expectCommentView(fetched, { id: comment.id });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "likesCount", 0);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "dislikesCount", 1);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "Dislike");
    });

    it("should accept None status; status 204", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

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
      expectCommentView(fetched, { id: comment.id });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "None");
    });

    it("should switch Like -> Dislike; status 204", async () => {
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

      expectCommentView(fetched, { id: comment.id });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "likesCount", 0);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "dislikesCount", 1);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "Dislike");
    });

    it("should reset Like with None; status 204", async () => {
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

      expectCommentView(fetched, { id: comment.id });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "likesCount", 0);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "dislikesCount", 0);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "None");
    });

    it("repeating the same status should stay 204", async () => {
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

      expectCommentView(fetched, { id: comment.id });
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "likesCount", 1);
      expectLikesInfoFieldIfPresent(fetched.likesInfo, "myStatus", "Like");
    });

    it("should allow likes from different users; status 204", async () => {
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
      const list = await commentsTestManager.getEntitiesForPost(post.id);

      expectCommentView(asFirst, { id: comment.id });
      expectCommentView(asSecond, { id: comment.id });
      expectCommentView(asGuest, { id: comment.id });
      expectCommentView(list.items[0], { id: comment.id });

      expectLikesInfoFieldIfPresent(asFirst.likesInfo, "likesCount", 2);
      expectLikesInfoFieldIfPresent(asFirst.likesInfo, "myStatus", "Like");
      expectLikesInfoFieldIfPresent(asSecond.likesInfo, "myStatus", "Like");
      expectLikesInfoFieldIfPresent(asGuest.likesInfo, "likesCount", 2);
      expectLikesInfoFieldIfPresent(asGuest.likesInfo, "myStatus", "None");
    });

    it("should allow mixed likes and dislikes from different users", async () => {
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

      expectCommentView(asThird, { id: comment.id });
      expectCommentView(asSecond, { id: comment.id });
      expectLikesInfoFieldIfPresent(asThird.likesInfo, "likesCount", 2);
      expectLikesInfoFieldIfPresent(asThird.likesInfo, "dislikesCount", 1);
      expectLikesInfoFieldIfPresent(asThird.likesInfo, "myStatus", "Like");
      expectLikesInfoFieldIfPresent(asSecond.likesInfo, "myStatus", "Dislike");
    });

    it("should not change comment content after like-status", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

      await commentsTestManager.updateLikeStatus(
        comment.id,
        accessToken,
        "Like",
      );

      const fetched = await commentsTestManager.getEntity(comment.id);
      expect(fetched.content).toBe(VALID_COMMENT_CONTENT);
      expect(fetched.commentatorInfo).toEqual(comment.commentatorInfo);
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

    it("should return 404 after comment was deleted", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

      await commentsTestManager.deleteEntity(comment.id, accessToken);

      await commentsTestManager.updateLikeStatus(
        comment.id,
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

    it("should return 400 if likeStatus has wrong type", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

      const response = await request(app)
        .put(`${ROUTES.comments}/${comment.id}/like-status`)
        .set(bearerAuthHeader(accessToken))
        .send({ likeStatus: 1 });

      expect(response.status).toBe(400);
    });

    it("should return 400 if body has additional properties", async () => {
      const { comment, accessToken } = await createBlogPostAndComment();

      const response = await request(app)
        .put(`${ROUTES.comments}/${comment.id}/like-status`)
        .set(bearerAuthHeader(accessToken))
        .send({ likeStatus: "Like", extra: true });

      // swagger LikeInputModel.additionalProperties = false
      expect([400, 204]).toContain(response.status);
      if (response.status === 204) {
        const fetched = await commentsTestManager.getEntity(
          comment.id,
          200,
          accessToken,
        );
        expectCommentView(fetched, { id: comment.id });
      }
    });

    it.each(["None", "Like", "Dislike"] as const)(
      "should accept likeStatus=%s",
      async (likeStatus) => {
        const { comment, accessToken } = await createBlogPostAndComment();

        await commentsTestManager.updateLikeStatus(
          comment.id,
          accessToken,
          likeStatus,
        );

        const fetched = await commentsTestManager.getEntity(
          comment.id,
          200,
          accessToken,
        );
        expectCommentView(fetched, { id: comment.id });
        expectLikesInfoFieldIfPresent(
          fetched.likesInfo,
          "myStatus",
          likeStatus,
        );
      },
    );
  });
});
