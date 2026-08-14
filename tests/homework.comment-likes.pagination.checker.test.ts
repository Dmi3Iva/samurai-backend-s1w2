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
 * Remote checker: getCommentsWithLikesWithPaginationTest
 * commentsLikes-describe-v2.ts — timeout 30000 ms
 */
const CHECKER_TIMEOUT_MS = 30_000;

const ISO_DATE =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

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
    myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
  },
};

const likesInfo = (
  likesCount: number,
  dislikesCount: number,
  myStatus: LikeStatus,
) => ({ likesCount, dislikesCount, myStatus });

const CHECKER_COMMENT_CONTENT = "length_21-weqweqweqwq";

describe("Homework 11 — GET /posts/:postId/comments likes pagination (checker)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it(
    'GET -> "/posts/:postId/comments": create 6 comments then like/dislike from 4 users; get by user 1 with pagination',
    { timeout: CHECKER_TIMEOUT_MS },
    async () => {
      const tokens: string[] = [];
      for (let i = 1; i <= 4; i += 1) {
        const login = `lguser${i}`;
        const password = "qwerty12";
        await usersTestManager.createEntity({
          login,
          password,
          email: `lguser${i}@example.com`,
        });
        tokens.push(
          await authTestManager.loginAndGetTokenHomework({
            loginOrEmail: login,
            password,
          }),
        );
      }

      const [user1, user2, user3, user4] = tokens as [
        string,
        string,
        string,
        string,
      ];

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

      const createdList = await commentsTestManager.getEntitiesForPost(
        post.id,
        200,
        undefined,
        { pageNumber: 1, pageSize: 10, sortBy: "createdAt", sortDirection: "desc" },
      );

      expect(createdList.page).toBe(1);
      expect(createdList.pageSize).toBe(10);
      expect(createdList.totalCount).toBe(6);
      expect(createdList.pagesCount).toBe(1);
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

      // like comment 1 by user 1, user 2
      await commentsTestManager.updateLikeStatus(c1.id, user1, "Like");
      await commentsTestManager.updateLikeStatus(c1.id, user2, "Like");

      // like comment 2 by user 2, user 3
      await commentsTestManager.updateLikeStatus(c2.id, user2, "Like");
      await commentsTestManager.updateLikeStatus(c2.id, user3, "Like");

      // dislike comment 3 by user 1
      await commentsTestManager.updateLikeStatus(c3.id, user1, "Dislike");

      // like comment 4 by user 1, user 4, user 2, user 3
      await commentsTestManager.updateLikeStatus(c4.id, user1, "Like");
      await commentsTestManager.updateLikeStatus(c4.id, user4, "Like");
      await commentsTestManager.updateLikeStatus(c4.id, user2, "Like");
      await commentsTestManager.updateLikeStatus(c4.id, user3, "Like");

      // like comment 5 by user 2, dislike by user 3
      await commentsTestManager.updateLikeStatus(c5.id, user2, "Like");
      await commentsTestManager.updateLikeStatus(c5.id, user3, "Dislike");

      // like comment 6 by user 1, dislike by user 2
      await commentsTestManager.updateLikeStatus(c6.id, user1, "Like");
      await commentsTestManager.updateLikeStatus(c6.id, user2, "Dislike");

      const list = await commentsTestManager.getEntitiesForPost(
        post.id,
        200,
        user1,
        { pageNumber: 1, pageSize: 10, sortBy: "createdAt", sortDirection: "desc" },
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

      const byId = Object.fromEntries(
        list.items.map((item) => [item.id, item]),
      );

      expect(byId[c1.id]?.likesInfo).toEqual(likesInfo(2, 0, "Like"));
      expect(byId[c2.id]?.likesInfo).toEqual(likesInfo(2, 0, "None"));
      expect(byId[c3.id]?.likesInfo).toEqual(likesInfo(0, 1, "Dislike"));
      expect(byId[c4.id]?.likesInfo).toEqual(likesInfo(4, 0, "Like"));
      expect(byId[c5.id]?.likesInfo).toEqual(likesInfo(1, 1, "None"));
      expect(byId[c6.id]?.likesInfo).toEqual(likesInfo(1, 1, "Like"));
    },
  );
});
