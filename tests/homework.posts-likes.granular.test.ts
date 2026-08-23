import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import { ROUTES } from "./test.const";

/**
 * Fine-grained h12 cases — catch newestLikes / myStatus bugs without the big 6-post suite.
 */
describe("Homework 12 — Post likes (granular newestLikes / myStatus)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  const createUser = async (i: number) => {
    const login = `guser${i}`;
    const password = "qwerty12";
    const user = await usersTestManager.createEntity({
      login,
      password,
      email: `guser${i}@example.com`,
    });
    const token = await authTestManager.loginAndGetTokenHomework({
      loginOrEmail: login,
      password,
    });
    return { user, token, login };
  };

  const createPost = async () => {
    const blog = await blogsTestManager.createEntity({
      name: "granular blog",
      description: "granular post likes",
      websiteUrl: "https://granular-blog.com",
    });
    const post = await postsTestManager.createEntity({
      title: "granular post",
      shortDescription: "granular short",
      content: "granular post content here",
      blogId: blog.id,
    });
    return post;
  };

  it("viewer who did not like: myStatus None but newestLikes still lists others' Likes", async () => {
    const a = await createUser(1);
    const b = await createUser(2);
    const viewer = await createUser(3);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, a.token, "Like");
    await postsTestManager.updateLikeStatus(post.id, b.token, "Like");

    const fetched = await postsTestManager.getEntity(post.id, 200, viewer.token);

    expect(fetched.extendedLikesInfo.likesCount).toBe(2);
    expect(fetched.extendedLikesInfo.dislikesCount).toBe(0);
    expect(fetched.extendedLikesInfo.myStatus).toBe("None");
    expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(2);
    expect(
      fetched.extendedLikesInfo.newestLikes.map((l) => l.login).sort(),
    ).toEqual([a.login, b.login].sort());
  });

  it("guest (no auth): myStatus None and newestLikes still present", async () => {
    const a = await createUser(1);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, a.token, "Like");

    const fetched = await postsTestManager.getEntity(post.id);

    expect(fetched.extendedLikesInfo.myStatus).toBe("None");
    expect(fetched.extendedLikesInfo.likesCount).toBe(1);
    expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
    expect(fetched.extendedLikesInfo.newestLikes[0]).toEqual({
      addedAt: expect.any(String),
      userId: a.user.id,
      login: a.login,
    });
  });

  it("only Dislike: newestLikes is empty array", async () => {
    const a = await createUser(1);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, a.token, "Dislike");

    const fetched = await postsTestManager.getEntity(post.id, 200, a.token);

    expect(fetched.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "Dislike",
      newestLikes: [],
    });
  });

  it("Like then Dislike from same user: removed from newestLikes", async () => {
    const a = await createUser(1);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, a.token, "Like");
    let fetched = await postsTestManager.getEntity(post.id, 200, a.token);
    expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);

    await postsTestManager.updateLikeStatus(post.id, a.token, "Dislike");
    fetched = await postsTestManager.getEntity(post.id, 200, a.token);

    expect(fetched.extendedLikesInfo.likesCount).toBe(0);
    expect(fetched.extendedLikesInfo.dislikesCount).toBe(1);
    expect(fetched.extendedLikesInfo.newestLikes).toEqual([]);
  });

  it("mixed Like + Dislike from different users: newestLikes only Likes", async () => {
    const liker = await createUser(1);
    const disliker = await createUser(2);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, liker.token, "Like");
    await postsTestManager.updateLikeStatus(post.id, disliker.token, "Dislike");

    const fetched = await postsTestManager.getEntity(
      post.id,
      200,
      disliker.token,
    );

    expect(fetched.extendedLikesInfo.likesCount).toBe(1);
    expect(fetched.extendedLikesInfo.dislikesCount).toBe(1);
    expect(fetched.extendedLikesInfo.myStatus).toBe("Dislike");
    expect(fetched.extendedLikesInfo.newestLikes).toHaveLength(1);
    expect(fetched.extendedLikesInfo.newestLikes[0]?.login).toBe(liker.login);
  });

  it("newestLikes ordered newest first by like time", async () => {
    const first = await createUser(1);
    const second = await createUser(2);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, first.token, "Like");
    await postsTestManager.updateLikeStatus(post.id, second.token, "Like");

    const fetched = await postsTestManager.getEntity(post.id, 200, first.token);

    expect(fetched.extendedLikesInfo.newestLikes.map((l) => l.login)).toEqual([
      second.login,
      first.login,
    ]);
  });

  it("newestLikes item shape: addedAt, userId, login — no extra keys", async () => {
    const a = await createUser(1);
    const post = await createPost();

    await postsTestManager.updateLikeStatus(post.id, a.token, "Like");
    const fetched = await postsTestManager.getEntity(post.id, 200, a.token);
    const item = fetched.extendedLikesInfo.newestLikes[0];

    expect(item).toEqual({
      addedAt: expect.any(String),
      userId: a.user.id,
      login: a.login,
    });
    expect(Object.keys(item ?? {}).sort()).toEqual([
      "addedAt",
      "login",
      "userId",
    ]);
  });
});
