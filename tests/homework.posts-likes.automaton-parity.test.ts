import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import {
  postsTestManager,
  expectAutomatonPostSchema,
  assertLikeStatusRouteRegistered,
  type PostViewModel,
  type ExtendedLikesInfoViewModel,
} from "./postsTestManager";
import { ROUTES, bearerAuthHeader } from "./test.const";
import type { LikeStatus } from "./commentsTestManager";

/**
 * Mirrors the 13 failing automaton cases (Homework 12 — Posts likes).
 * Run: yarn test tests/homework.posts-likes.automaton-parity.test.ts
 */
const likesInfo = (
  likesCount: number,
  dislikesCount: number,
  myStatus: LikeStatus,
  newestLikes: ExtendedLikesInfoViewModel["newestLikes"] = [],
): ExtendedLikesInfoViewModel => ({
  likesCount,
  dislikesCount,
  myStatus,
  newestLikes,
});

describe("Homework 12 — Posts likes (automaton parity)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const createUsersAndTokens = async (count: number) => {
    const users = [];
    const tokens: string[] = [];

    for (let i = 1; i <= count; i += 1) {
      const login = `lguser${i}`;
      const password = "qwerty12";
      const user = await usersTestManager.createEntity({
        login,
        password,
        email: `lguser${i}@example.com`,
      });
      const token = await authTestManager.loginAndGetTokenHomework({
        loginOrEmail: login,
        password,
      });
      users.push(user);
      tokens.push(token);
    }

    return { users, tokens };
  };

  const createBlog = async () =>
    blogsTestManager.createEntity({
      name: "new blog",
      description: "description",
      websiteUrl: "https://newblog.com",
    });

  const postPayload = (blogId: string) => ({
    title: "post title",
    shortDescription: "description",
    content: "new post content",
    blogId,
  });

  const postPayloadForBlogEndpoint = () => ({
    title: "post title",
    shortDescription: "description",
    content: "new post content",
  });

  describe("extendedLikesInfo in post responses", () => {
    it('POST -> "/posts": status 201; body matches checker schema; GET /posts/:id strictEqual', async () => {
      const blog = await createBlog();
      const createResponse = await request(app)
        .post(`${ROUTES.posts}`)
        .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
        .send(postPayload(blog.id));

      expect(createResponse.status).toBe(201);
      expectAutomatonPostSchema(createResponse.body as PostViewModel);

      const getResponse = await request(app).get(
        `${ROUTES.posts}/${createResponse.body.id}`,
      );

      expect(getResponse.status).toBe(200);
      expectAutomatonPostSchema(getResponse.body as PostViewModel);
      expect(getResponse.body).toStrictEqual(createResponse.body);
    });

    it('GET -> "/posts/:id": status 200; body matches checker schema', async () => {
      const blog = await createBlog();
      const created = await postsTestManager.createEntity(postPayload(blog.id));
      const fetched = await postsTestManager.getEntity(created.id);

      expectAutomatonPostSchema(fetched);
      expect(fetched).toStrictEqual(created);
    });

    it('POST -> "/blogs/:blogId/posts": status 201; body matches checker schema; GET strictEqual', async () => {
      const blog = await createBlog();
      const createResponse = await request(app)
        .post(`${ROUTES.blogs}/${blog.id}/posts`)
        .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
        .send(postPayloadForBlogEndpoint());

      expect(createResponse.status).toBe(201);
      expectAutomatonPostSchema(createResponse.body as PostViewModel);

      const getResponse = await request(app).get(
        `${ROUTES.posts}/${createResponse.body.id}`,
      );

      expect(getResponse.status).toBe(200);
      expectAutomatonPostSchema(getResponse.body as PostViewModel);
      expect(getResponse.body).toStrictEqual(createResponse.body);
    });
  });

  describe('PUT -> "/posts/:postId/like-status" route & auth', () => {
    it("route is registered (not Express 404 HTML)", async () => {
      const blog = await createBlog();
      const post = await postsTestManager.createEntity(postPayload(blog.id));
      const { tokens } = await createUsersAndTokens(1);
      const token = tokens[0] as string;

      const response = await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .set(bearerAuthHeader(token))
        .send({ likeStatus: "Like" });

      assertLikeStatusRouteRegistered(response);
      expect(response.status).toBe(204);
    });

    it("should return 401 if auth credentials is incorrect (not 404)", async () => {
      const blog = await createBlog();
      const post = await postsTestManager.createEntity(postPayload(blog.id));

      const response = await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .send({});

      assertLikeStatusRouteRegistered(response);
      expect(response.status).toBe(401);
    });

    it('should return 400 if likeStatus is empty string (not 404)', async () => {
      const blog = await createBlog();
      const post = await postsTestManager.createEntity(postPayload(blog.id));
      const { tokens } = await createUsersAndTokens(1);
      const token = tokens[0] as string;

      const response = await request(app)
        .put(`${ROUTES.posts}/${post.id}/like-status`)
        .set(bearerAuthHeader(token))
        .send({ likeStatus: "" });

      assertLikeStatusRouteRegistered(response);
      expect(response.status).toBe(400);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "likeStatus" }),
        ]),
      );
    });
  });

  describe("like flows (automaton postLikes-describe-v2)", () => {
    const createPostForLikes = async () => {
      const blog = await createBlog();
      return postsTestManager.createEntity(postPayload(blog.id));
    };

    it("4 users Like: newestLikes descending after each like by user 1", async () => {
      const { users, tokens } = await createUsersAndTokens(4);
      const [u1, u2, u3, u4] = tokens as [string, string, string, string];
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, u1, "Like");
      let fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(1);
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);

      await postsTestManager.updateLikeStatus(post.id, u2, "Like");
      fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(2);
      expect(fetched.extendedLikesInfo.newestLikes.map((l) => l.login)).toEqual([
        users[1]?.login,
        users[0]?.login,
      ]);

      await postsTestManager.updateLikeStatus(post.id, u3, "Like");
      fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(3);
      expect(fetched.extendedLikesInfo.newestLikes.map((l) => l.login)).toEqual([
        users[2]?.login,
        users[1]?.login,
        users[0]?.login,
      ]);

      await postsTestManager.updateLikeStatus(post.id, u4, "Like");
      fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(4);
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(3);
      expect(fetched.extendedLikesInfo.newestLikes.map((l) => l.login)).toEqual([
        users[3]?.login,
        users[2]?.login,
        users[1]?.login,
      ]);
    });

    it("Dislike x2 then Like: counts and newestLikes", async () => {
      const { tokens } = await createUsersAndTokens(3);
      const [u1, u2, u3] = tokens as [string, string, string];
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, u1, "Dislike");
      await postsTestManager.updateLikeStatus(post.id, u2, "Dislike");
      await postsTestManager.updateLikeStatus(post.id, u3, "Like");

      const fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo).toMatchObject({
        likesCount: 1,
        dislikesCount: 2,
        myStatus: "Dislike",
      });
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
    });

    it("Like twice by same user: count increases once", async () => {
      const { tokens } = await createUsersAndTokens(1);
      const u1 = tokens[0] as string;
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, u1, "Like");
      await postsTestManager.updateLikeStatus(post.id, u1, "Like");

      const fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(1);
      expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
    });

    it("Like -> Dislike -> None by same user", async () => {
      const { tokens } = await createUsersAndTokens(1);
      const u1 = tokens[0] as string;
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, u1, "Like");
      let fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo.likesCount).toBe(1);

      await postsTestManager.updateLikeStatus(post.id, u1, "Dislike");
      fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo).toEqual(likesInfo(0, 1, "Dislike", []));

      await postsTestManager.updateLikeStatus(post.id, u1, "None");
      fetched = await postsTestManager.getEntity(post.id, 200, u1);
      expect(fetched.extendedLikesInfo).toEqual(likesInfo(0, 0, "None", []));
    });

    it("user1 Like then user2 Dislike: each sees own myStatus", async () => {
      const { tokens } = await createUsersAndTokens(2);
      const [u1, u2] = tokens as [string, string];
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, u1, "Like");
      let asFirst = await postsTestManager.getEntity(post.id, 200, u1);
      expect(asFirst.extendedLikesInfo.myStatus).toBe("Like");

      await postsTestManager.updateLikeStatus(post.id, u2, "Dislike");
      asFirst = await postsTestManager.getEntity(post.id, 200, u1);
      const asSecond = await postsTestManager.getEntity(post.id, 200, u2);

      expect(asFirst.extendedLikesInfo.myStatus).toBe("Like");
      expect(asSecond.extendedLikesInfo.myStatus).toBe("Dislike");
      expect(asFirst.extendedLikesInfo.likesCount).toBe(1);
      expect(asFirst.extendedLikesInfo.dislikesCount).toBe(1);
    });

    it('GET /posts/:id by unauthorized user after like: myStatus None; status 200', async () => {
      const { tokens } = await createUsersAndTokens(1);
      const token = tokens[0] as string;
      const post = await createPostForLikes();

      await postsTestManager.updateLikeStatus(post.id, token, "Like");

      const asGuest = await postsTestManager.getEntity(post.id);
      expectAutomatonPostSchema(asGuest);
      expect(asGuest.extendedLikesInfo.myStatus).toBe("None");
      expect(asGuest.extendedLikesInfo.likesCount).toBe(1);
      expect(asGuest.extendedLikesInfo.newestLikes).toHaveLength(1);
    });
  });

  describe("lists with extendedLikesInfo after likes", () => {
    const likeSixPostsScenario = async (
      createPosts: (blogId: string) => Promise<PostViewModel[]>,
      getList: (blogId: string, token: string) => Promise<{ items: PostViewModel[] }>,
    ) => {
      const { users, tokens } = await createUsersAndTokens(4);
      const [user1, user2, user3, user4] = tokens as [
        string,
        string,
        string,
        string,
      ];

      const blog = await createBlog();
      const posts = await createPosts(blog.id);

      for (const item of posts) {
        expectAutomatonPostSchema(item);
      }

      const [p1, p2, p3, p4, p5, p6] = posts as [
        PostViewModel,
        PostViewModel,
        PostViewModel,
        PostViewModel,
        PostViewModel,
        PostViewModel,
      ];

      await postsTestManager.updateLikeStatus(p1.id, user1, "Like");
      await postsTestManager.updateLikeStatus(p1.id, user2, "Like");
      await postsTestManager.updateLikeStatus(p2.id, user2, "Like");
      await postsTestManager.updateLikeStatus(p2.id, user3, "Like");
      await postsTestManager.updateLikeStatus(p3.id, user1, "Dislike");
      await postsTestManager.updateLikeStatus(p4.id, user1, "Like");
      await postsTestManager.updateLikeStatus(p4.id, user4, "Like");
      await postsTestManager.updateLikeStatus(p4.id, user2, "Like");
      await postsTestManager.updateLikeStatus(p4.id, user3, "Like");
      await postsTestManager.updateLikeStatus(p5.id, user2, "Like");
      await postsTestManager.updateLikeStatus(p5.id, user3, "Dislike");
      await postsTestManager.updateLikeStatus(p6.id, user1, "Like");
      await postsTestManager.updateLikeStatus(p6.id, user2, "Dislike");

      const list = await getList(blog.id, user1);

      expect(list.items).toHaveLength(6);
      for (const item of list.items) {
        expectAutomatonPostSchema(item);
      }

      const byId = Object.fromEntries(list.items.map((item) => [item.id, item]));

      expect(byId[p1.id]?.extendedLikesInfo.likesCount).toBe(2);
      expect(byId[p2.id]?.extendedLikesInfo.myStatus).toBe("None");
      expect(byId[p2.id]?.extendedLikesInfo.newestLikes).toHaveLength(2);
      expect(byId[p3.id]?.extendedLikesInfo).toEqual(
        likesInfo(0, 1, "Dislike", []),
      );
      expect(byId[p4.id]?.extendedLikesInfo.newestLikes).toHaveLength(3);
      expect(byId[p5.id]?.extendedLikesInfo.newestLikes[0]?.login).toBe(
        users[1]?.login,
      );
      expect(byId[p6.id]?.extendedLikesInfo.myStatus).toBe("Like");
    };

    it('GET -> "/posts": 6 posts with likes; every item has extendedLikesInfo', async () => {
      await likeSixPostsScenario(
        async (blogId) => {
          const created: PostViewModel[] = [];
          for (let i = 0; i < 6; i += 1) {
            created.push(
              await postsTestManager.createEntity(postPayload(blogId)),
            );
          }
          return created;
        },
        async (_blogId, token) => postsTestManager.getEntities(200, token),
      );
    });

    it('GET -> "/blogs/:blogId/posts": 6 posts via blog endpoint; every item has extendedLikesInfo', async () => {
      await likeSixPostsScenario(
        async (blogId) => {
          const created: PostViewModel[] = [];
          for (let i = 0; i < 6; i += 1) {
            created.push(
              await postsTestManager.createEntityViaBlog(
                blogId,
                postPayloadForBlogEndpoint(),
              ),
            );
          }
          return created;
        },
        async (blogId, token) =>
          postsTestManager.getEntitiesByBlog(blogId, 200, token),
      );
    });
  });
});
