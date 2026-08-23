import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import {
  postsTestManager,
  DEFAULT_EXTENDED_LIKES_INFO,
  expectPostView,
  expectExtendedLikesInfo,
  type PostViewModel,
} from "./postsTestManager";
import {
  ROUTES,
  HOMEWORK_USER,
  bearerAuthHeader,
} from "./test.const";
import { homeworkState } from "./homeworkState";

/**
 * Homework 12 — Post likes (swagger h12)
 * - PUT /posts/{postId}/like-status
 * - PostViewModel.extendedLikesInfo (+ newestLikes last 3 Likes)
 */
describe("Homework 12 — Post likes (swagger h12)", () => {
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
    const accessToken = homeworkState.getAccessToken();

    const blog = await blogsTestManager.createEntity({
      name: "hw post likes",
      description: "homework post likes blog",
      websiteUrl: "https://hw-post-likes-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "hw post likes post",
      shortDescription: "homework post likes post",
      content: "homework post likes post content",
      blogId: blog.id,
    });

    return { blog, post, accessToken };
  };

  const createSecondUserToken = async (
    login = "pliker-2",
    password = "password123",
    email = "pliker2@example.com",
  ) => {
    await usersTestManager.createEntity({ login, password, email });
    return authTestManager.loginAndGetTokenHomework({
      loginOrEmail: login,
      password,
    });
  };

  describe("PostViewModel (extendedLikesInfo required)", () => {
    it("POST post: should return extendedLikesInfo with defaults; status 201", async () => {
      const { post } = await createBlogAndPost();

      expectPostView(post, {
        title: "hw post likes post",
        extendedLikesInfo: DEFAULT_EXTENDED_LIKES_INFO,
      });
    });

    it("GET /posts/:id without auth: myStatus None", async () => {
      const { post } = await createBlogAndPost();

      const fetched = await postsTestManager.getEntity(post.id);

      expectPostView(fetched, {
        id: post.id,
        extendedLikesInfo: DEFAULT_EXTENDED_LIKES_INFO,
      });
    });

    it("GET /posts/:id with auth: myStatus None initially", async () => {
      const { post, accessToken } = await createBlogAndPost();

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expectPostView(fetched, {
        id: post.id,
        extendedLikesInfo: DEFAULT_EXTENDED_LIKES_INFO,
      });
    });

    it("GET /posts: items must include extendedLikesInfo", async () => {
      const { post } = await createBlogAndPost();

      const list = await postsTestManager.getEntities();

      expect(list.totalCount).toBe(1);
      expect(list.items).toHaveLength(1);
      expectPostView(list.items[0] as PostViewModel, {
        id: post.id,
        extendedLikesInfo: DEFAULT_EXTENDED_LIKES_INFO,
      });
    });

    it("GET /blogs/:blogId/posts: items must include extendedLikesInfo", async () => {
      const { blog, post } = await createBlogAndPost();

      const list = await postsTestManager.getEntitiesByBlog(blog.id);

      expect(list.totalCount).toBe(1);
      expectPostView(list.items[0] as PostViewModel, {
        id: post.id,
        extendedLikesInfo: DEFAULT_EXTENDED_LIKES_INFO,
      });
    });
  });

  describe("PUT /posts/:postId/like-status", () => {
    it("should like post; status 204", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expectPostView(fetched, { id: post.id });
      expect(fetched.extendedLikesInfo.likesCount).toBe(1);
      expect(fetched.extendedLikesInfo.dislikesCount).toBe(0);
      expect(fetched.extendedLikesInfo.myStatus).toBe("Like");
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
      expect(fetched.extendedLikesInfo.newestLikes[0]).toEqual({
        addedAt: expect.any(String),
        userId: expect.any(String),
        login: HOMEWORK_USER.login,
      });
    });

    it("should dislike post; status 204", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Dislike");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expectExtendedLikesInfo(fetched.extendedLikesInfo, {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: "Dislike",
        newestLikes: [],
      });
    });

    it("should accept None status; status 204", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "None");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );
      expectExtendedLikesInfo(
        fetched.extendedLikesInfo,
        DEFAULT_EXTENDED_LIKES_INFO,
      );
    });

    it("should switch Like -> Dislike; newestLikes empty after dislike", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");
      await postsTestManager.updateLikeStatus(post.id, accessToken, "Dislike");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expectExtendedLikesInfo(fetched.extendedLikesInfo, {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: "Dislike",
        newestLikes: [],
      });
    });

    it("should reset Like with None", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");
      await postsTestManager.updateLikeStatus(post.id, accessToken, "None");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expectExtendedLikesInfo(
        fetched.extendedLikesInfo,
        DEFAULT_EXTENDED_LIKES_INFO,
      );
    });

    it("repeating the same status should stay 204", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");
      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expect(fetched.extendedLikesInfo.likesCount).toBe(1);
      expect(fetched.extendedLikesInfo.myStatus).toBe("Like");
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
    });

    it("should allow likes from different users", async () => {
      const { post, accessToken } = await createBlogAndPost();
      const secondToken = await createSecondUserToken();

      await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");
      await postsTestManager.updateLikeStatus(post.id, secondToken, "Like");

      const asFirst = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );
      const asSecond = await postsTestManager.getEntity(
        post.id,
        200,
        secondToken,
      );
      const asGuest = await postsTestManager.getEntity(post.id);

      expect(asFirst.extendedLikesInfo.likesCount).toBe(2);
      expect(asFirst.extendedLikesInfo.myStatus).toBe("Like");
      expect(asSecond.extendedLikesInfo.myStatus).toBe("Like");
      expect(asGuest.extendedLikesInfo.myStatus).toBe("None");
      expect(asGuest.extendedLikesInfo.likesCount).toBe(2);
      expect(asFirst.extendedLikesInfo.newestLikes).toHaveLength(2);
    });

    it("newestLikes should keep only last 3 Likes (newest first)", async () => {
      const { post, accessToken } = await createBlogAndPost();
      const tokens = [accessToken];
      const logins = [HOMEWORK_USER.login];

      for (let i = 2; i <= 4; i += 1) {
        const login = `pliker-${i}`;
        tokens.push(
          await createSecondUserToken(
            login,
            "password123",
            `pliker${i}@example.com`,
          ),
        );
        logins.push(login);
      }

      for (const token of tokens) {
        await postsTestManager.updateLikeStatus(post.id, token, "Like");
      }

      const fetched = await postsTestManager.getEntity(
        post.id,
        200,
        accessToken,
      );

      expect(fetched.extendedLikesInfo.likesCount).toBe(4);
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(3);
      expect(fetched.extendedLikesInfo.newestLikes.map((l) => l.login)).toEqual(
        [logins[3], logins[2], logins[1]],
      );
    });

    it("should return 401 if auth credentials is incorrect", async () => {
      const { post } = await createBlogAndPost();

      await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .send({ likeStatus: "Like" })
        .expect(401);

      await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
        .send({ likeStatus: "Like" })
        .expect(401);

      await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .set(bearerAuthHeader("invalid.token.value"))
        .send({ likeStatus: "Like" })
        .expect(401);
    });

    it("should return 404 if post does not exist", async () => {
      const accessToken = homeworkState.getAccessToken();
      const fakeId = "507f1f77bcf86cd799439011";

      await postsTestManager.updateLikeStatus(
        fakeId,
        accessToken,
        "Like",
        404,
      );
    });

    it("should return 404 after post was deleted", async () => {
      const { post, accessToken } = await createBlogAndPost();

      await postsTestManager.deleteEntity(post.id);

      await postsTestManager.updateLikeStatus(
        post.id,
        accessToken,
        "Like",
        404,
      );
    });

    it("should return 400 if likeStatus is incorrect", async () => {
      const { post, accessToken } = await createBlogAndPost();

      const response = await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
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
      const { post, accessToken } = await createBlogAndPost();

      const response = await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .set(bearerAuthHeader(accessToken))
        .send({ likeStatus: 1 });

      expect(response.status).toBe(400);
    });

    it.each(["None", "Like", "Dislike"] as const)(
      "should accept likeStatus=%s",
      async (likeStatus) => {
        const { post, accessToken } = await createBlogAndPost();

        await postsTestManager.updateLikeStatus(
          post.id,
          accessToken,
          likeStatus,
        );

        const fetched = await postsTestManager.getEntity(
          post.id,
          200,
          accessToken,
        );
        expect(fetched.extendedLikesInfo.myStatus).toBe(likeStatus);
        expect(fetched.extendedLikesInfo.likesCount).toBe(
          likeStatus === "Like" ? 1 : 0,
        );
        expect(fetched.extendedLikesInfo.dislikesCount).toBe(
          likeStatus === "Dislike" ? 1 : 0,
        );
      },
    );
  });
});
