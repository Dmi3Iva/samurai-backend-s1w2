import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { authTestManager } from "./authTestManager";
import { blogsTestManager } from "./blogsTestManager";
import { postsTestManager } from "./postsTestManager";
import {
  commentsTestManager,
  type CommentViewModel,
  type LikeStatus,
} from "./commentsTestManager";
import { ROUTES } from "./test.const";

/**
 * Mirrors remote checker comments-V2 / commentsLikes-describe-v2.
 * likesInfo + myStatus are required in the checker even if swagger marks them optional.
 */
const ISO_DATE =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

const LIKE_STATUS = /^Like$|^Dislike$|^None$/;

const CHECKER_COMMENT_CONTENT = "length_21-weqweqweqwq";

const commentSchema = {
  id: expect.any(String),
  content: expect.any(String),
  createdAt: expect.stringMatching(ISO_DATE),
  commentatorInfo: {
    userId: expect.any(String),
    userLogin: expect.any(String),
  },
  likesInfo: {
    likesCount: expect.any(Number),
    dislikesCount: expect.any(Number),
    myStatus: expect.stringMatching(LIKE_STATUS),
  },
};

const likesInfo = (
  likesCount: number,
  dislikesCount: number,
  myStatus: LikeStatus,
) => ({ likesCount, dislikesCount, myStatus });

describe("Homework 11 — Comment likes (remote checker parity)", () => {
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
      name: "hw likes",
      description: "homework likes blog",
      websiteUrl: "https://hw-likes-blog.com",
    });

    const post = await postsTestManager.createEntity({
      title: "hw likes post",
      shortDescription: "homework likes post",
      content: "homework likes post content",
      blogId: blog.id,
    });

    return { blog, post };
  };

  it('POST -> "/posts/:postId/comments": should create new comment; status 201; content: created comment', async () => {
    const { tokens } = await createUsersAndTokens(1);
    const { post } = await createBlogAndPost();
    const accessToken = tokens[0] as string;

    const created = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      CHECKER_COMMENT_CONTENT,
    );

    expect(created).toEqual(commentSchema);

    const fetched = await commentsTestManager.getEntity(created.id);
    expect(fetched).toEqual(commentSchema);
    expect(fetched).toStrictEqual(created);
  });

  it('GET -> "comments/:commentsId": should return status 200; content: comment by id', async () => {
    const { tokens } = await createUsersAndTokens(1);
    const { post } = await createBlogAndPost();
    const accessToken = tokens[0] as string;

    const created = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      CHECKER_COMMENT_CONTENT,
    );

    const fetched = await commentsTestManager.getEntity(created.id);

    expect(fetched).toEqual(commentSchema);
    expect(fetched).toStrictEqual(created);
    expect(fetched.likesInfo).toEqual(likesInfo(0, 0, "None"));
  });

  it("GET -> /comments/:commentId: unauthorized user should see liked comment with myStatus None", async () => {
    const { tokens } = await createUsersAndTokens(1);
    const { post } = await createBlogAndPost();
    const accessToken = tokens[0] as string;

    const created = await commentsTestManager.createEntity(
      post.id,
      accessToken,
      CHECKER_COMMENT_CONTENT,
    );

    await commentsTestManager.updateLikeStatus(
      created.id,
      accessToken,
      "Like",
    );

    const asOwner = await commentsTestManager.getEntity(
      created.id,
      200,
      accessToken,
    );
    expect(asOwner).toEqual(commentSchema);
    expect(asOwner.likesInfo).toEqual(likesInfo(1, 0, "Like"));

    const asGuest = await commentsTestManager.getEntity(created.id);
    expect(asGuest).toEqual(commentSchema);
    expect(asGuest.likesInfo?.myStatus).toBe("None");
    expect(asGuest.likesInfo?.likesCount).toBe(1);
    expect(asGuest.likesInfo?.dislikesCount).toBe(0);
  });

  it("GET -> /posts/:postId/comments: create 6 comments, like/dislike from several users, then get by user 1", async () => {
    const { tokens } = await createUsersAndTokens(4);
    const { post } = await createBlogAndPost();
    const [user1, user2, user3, user4] = tokens as [
      string,
      string,
      string,
      string,
    ];

    const comments: CommentViewModel[] = [];
    for (let i = 0; i < 6; i += 1) {
      comments.push(
        await commentsTestManager.createEntity(
          post.id,
          user1,
          CHECKER_COMMENT_CONTENT,
        ),
      );
    }

    const createdList = await commentsTestManager.getEntitiesForPost(post.id);
    expect(createdList.items).toHaveLength(6);
    for (const item of createdList.items) {
      expect(item).toEqual(commentSchema);
    }

    const [c1, c2, c3, c4, c5, c6] = comments as [
      CommentViewModel,
      CommentViewModel,
      CommentViewModel,
      CommentViewModel,
      CommentViewModel,
      CommentViewModel,
    ];

    await commentsTestManager.updateLikeStatus(c1.id, user1, "Like");
    await commentsTestManager.updateLikeStatus(c1.id, user2, "Like");

    await commentsTestManager.updateLikeStatus(c2.id, user2, "Like");
    await commentsTestManager.updateLikeStatus(c2.id, user3, "Like");

    await commentsTestManager.updateLikeStatus(c3.id, user1, "Dislike");

    await commentsTestManager.updateLikeStatus(c4.id, user1, "Like");
    await commentsTestManager.updateLikeStatus(c4.id, user4, "Like");
    await commentsTestManager.updateLikeStatus(c4.id, user2, "Like");
    await commentsTestManager.updateLikeStatus(c4.id, user3, "Like");

    await commentsTestManager.updateLikeStatus(c5.id, user2, "Like");
    await commentsTestManager.updateLikeStatus(c5.id, user3, "Dislike");

    await commentsTestManager.updateLikeStatus(c6.id, user1, "Like");
    await commentsTestManager.updateLikeStatus(c6.id, user2, "Dislike");

    const list = await commentsTestManager.getEntitiesForPost(
      post.id,
      200,
      user1,
    );

    expect(list).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 6,
      items: expect.any(Array),
    });
    expect(list.items).toHaveLength(6);

    for (const item of list.items) {
      expect(item).toEqual(commentSchema);
    }

    const byId = Object.fromEntries(list.items.map((item) => [item.id, item]));

    expect(byId[c1.id]?.likesInfo).toEqual(likesInfo(2, 0, "Like"));
    expect(byId[c2.id]?.likesInfo).toEqual(likesInfo(2, 0, "None"));
    expect(byId[c3.id]?.likesInfo).toEqual(likesInfo(0, 1, "Dislike"));
    expect(byId[c4.id]?.likesInfo).toEqual(likesInfo(4, 0, "Like"));
    expect(byId[c5.id]?.likesInfo).toEqual(likesInfo(1, 1, "None"));
    expect(byId[c6.id]?.likesInfo).toEqual(likesInfo(1, 1, "Like"));
  });
});
