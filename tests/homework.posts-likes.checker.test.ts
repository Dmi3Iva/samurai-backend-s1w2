import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import {
  postsTestManager,
  type PostViewModel,
  type ExtendedLikesInfoViewModel,
} from "./postsTestManager";
import { ROUTES } from "./test.const";
import type { LikeStatus } from "./commentsTestManager";

/**
 * Mirrors remote checker posts likes / postsLikes-describe (swagger h12).
 * extendedLikesInfo + newestLikes are required in the checker.
 */
const ISO_DATE =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)/;

const LIKE_STATUS = /^Like$|^Dislike$|^None$/;

const postSchema = {
  id: expect.any(String),
  title: expect.any(String),
  shortDescription: expect.any(String),
  content: expect.any(String),
  blogId: expect.any(String),
  blogName: expect.any(String),
  createdAt: expect.stringMatching(ISO_DATE),
  extendedLikesInfo: {
    likesCount: expect.any(Number),
    dislikesCount: expect.any(Number),
    myStatus: expect.stringMatching(LIKE_STATUS),
    newestLikes: expect.any(Array),
  },
};

/** Counts + myStatus only — do NOT default newestLikes to [] (toMatchObject would fail). */
const likesCounts = (
  likesCount: number,
  dislikesCount: number,
  myStatus: LikeStatus,
) => ({
  likesCount,
  dislikesCount,
  myStatus,
});

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

describe("Homework 12 — Post likes (remote checker parity)", () => {
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

  const createBlogAndPost = async () => {
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

    return { blog, post };
  };

  it('POST -> "/posts": should create post with extendedLikesInfo defaults; status 201', async () => {
    const { post } = await createBlogAndPost();

    expect(post).toEqual(postSchema);
    expect(post.extendedLikesInfo).toEqual(likesInfo(0, 0, "None", []));

    const fetched = await postsTestManager.getEntity(post.id);
    expect(fetched).toEqual(postSchema);
    expect(fetched.extendedLikesInfo).toEqual(likesInfo(0, 0, "None", []));
  });

  it('GET -> "/posts/:id": unauthorized user should see liked post with myStatus None', async () => {
    const { tokens } = await createUsersAndTokens(1);
    const { post } = await createBlogAndPost();
    const accessToken = tokens[0] as string;

    await postsTestManager.updateLikeStatus(post.id, accessToken, "Like");

    const asOwner = await postsTestManager.getEntity(
      post.id,
      200,
      accessToken,
    );
    expect(asOwner).toEqual(postSchema);
    expect(asOwner.extendedLikesInfo.likesCount).toBe(1);
    expect(asOwner.extendedLikesInfo.myStatus).toBe("Like");
    expect(asOwner.extendedLikesInfo.newestLikes).toHaveLength(1);

    const asGuest = await postsTestManager.getEntity(post.id);
    expect(asGuest).toEqual(postSchema);
    expect(asGuest.extendedLikesInfo.myStatus).toBe("None");
    expect(asGuest.extendedLikesInfo.likesCount).toBe(1);
    expect(asGuest.extendedLikesInfo.newestLikes).toHaveLength(1);
  });

  it("GET -> /posts: create 6 posts, like/dislike from several users, then get by user 1", async () => {
    const { tokens, users } = await createUsersAndTokens(4);
    const [user1, user2, user3, user4] = tokens as [
      string,
      string,
      string,
      string,
    ];

    const blog = await blogsTestManager.createEntity({
      name: "hw posts",
      description: "homework posts blog",
      websiteUrl: "https://hw-posts-blog.com",
    });

    const posts: PostViewModel[] = [];
    for (let i = 0; i < 6; i += 1) {
      posts.push(
        await postsTestManager.createEntity({
          title: `post title ${i}`,
          shortDescription: `short description ${i}`,
          content: `post content number ${i}`,
          blogId: blog.id,
        }),
      );
    }

    const createdList = await postsTestManager.getEntities();
    expect(createdList.items).toHaveLength(6);
    for (const item of createdList.items) {
      expect(item).toEqual(postSchema);
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

    const list = await postsTestManager.getEntities(200, user1);

    expect(list).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 6,
      items: expect.any(Array),
    });
    expect(list.items).toHaveLength(6);

    for (const item of list.items) {
      expect(item).toEqual(postSchema);
    }

    const byId = Object.fromEntries(list.items.map((item) => [item.id, item]));

    // p1: liked by user1 + user2 — viewer is user1
    expect(byId[p1.id]?.extendedLikesInfo).toMatchObject(
      likesCounts(2, 0, "Like"),
    );
    expect(byId[p1.id]?.extendedLikesInfo.newestLikes).toHaveLength(2);

    // p2: liked by user2 + user3 — viewer user1 did not like → myStatus None
    // newestLikes MUST list both likes (bug was expecting [] via likesInfo default)
    expect(byId[p2.id]?.extendedLikesInfo).toMatchObject(
      likesCounts(2, 0, "None"),
    );
    expect(byId[p2.id]?.extendedLikesInfo.newestLikes).toHaveLength(2);
    expect(
      byId[p2.id]?.extendedLikesInfo.newestLikes.map((l) => l.login).sort(),
    ).toEqual([users[1]?.login, users[2]?.login].sort());

    // p3: only dislike — newestLikes empty
    expect(byId[p3.id]?.extendedLikesInfo).toEqual(
      likesInfo(0, 1, "Dislike", []),
    );

    // p4: 4 likes — newestLikes capped at 3, newest first (user3, user2, user4)
    expect(byId[p4.id]?.extendedLikesInfo).toMatchObject(
      likesCounts(4, 0, "Like"),
    );
    expect(byId[p4.id]?.extendedLikesInfo.newestLikes).toHaveLength(3);
    expect(
      byId[p4.id]?.extendedLikesInfo.newestLikes.map((l) => l.login),
    ).toEqual([
      users[2]?.login,
      users[1]?.login,
      users[3]?.login,
    ]);

    // p5: user2 Like + user3 Dislike — viewer user1 → None; newestLikes only Likes
    expect(byId[p5.id]?.extendedLikesInfo).toMatchObject(
      likesCounts(1, 1, "None"),
    );
    expect(byId[p5.id]?.extendedLikesInfo.newestLikes).toHaveLength(1);
    expect(byId[p5.id]?.extendedLikesInfo.newestLikes[0]?.login).toBe(
      users[1]?.login,
    );

    // p6: user1 Like + user2 Dislike
    expect(byId[p6.id]?.extendedLikesInfo).toMatchObject(
      likesCounts(1, 1, "Like"),
    );
    expect(byId[p6.id]?.extendedLikesInfo.newestLikes).toHaveLength(1);
    expect(byId[p6.id]?.extendedLikesInfo.newestLikes[0]?.login).toBe(
      users[0]?.login,
    );
  });
});
