import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { ROUTES, bearerAuthHeader, VALID_COMMENT_CONTENT } from "./test.const";

export type LikeStatus = "None" | "Like" | "Dislike";

interface CommentatorInfo {
  userId: string;
  userLogin: string;
}

export interface LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export interface CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}

export const DEFAULT_LIKES_INFO: LikesInfoViewModel = {
  likesCount: 0,
  dislikesCount: 0,
  myStatus: "None",
};

const COMMENT_VIEW_KEYS = [
  "id",
  "content",
  "commentatorInfo",
  "createdAt",
  "likesInfo",
] as const;

const LIKES_INFO_KEYS = ["likesCount", "dislikesCount", "myStatus"] as const;
const LIKE_STATUSES: LikeStatus[] = ["None", "Like", "Dislike"];

interface PaginatedCommentsResponse {
  items: CommentViewModel[];
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
}

/** Remote checker requires likesInfo with likesCount, dislikesCount, myStatus */
export function expectCommentView(
  comment: CommentViewModel,
  expected: {
    id?: string;
    content?: string;
    commentatorInfo?: CommentatorInfo;
    likesInfo?: LikesInfoViewModel;
  } = {},
) {
  expect(comment).toEqual({
    id: expected.id ?? expect.any(String),
    content: expected.content ?? expect.any(String),
    commentatorInfo: expected.commentatorInfo ?? {
      userId: expect.any(String),
      userLogin: expect.any(String),
    },
    createdAt: expect.any(String),
    likesInfo: expected.likesInfo ?? {
      likesCount: expect.any(Number),
      dislikesCount: expect.any(Number),
      myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
    },
  });

  const extraKeys = Object.keys(comment).filter(
    (key) => !COMMENT_VIEW_KEYS.includes(key as (typeof COMMENT_VIEW_KEYS)[number]),
  );
  expect(extraKeys).toEqual([]);

  expectLikesInfoSchema(comment.likesInfo);
}

export function expectLikesInfoSchema(likesInfo: LikesInfoViewModel) {
  expect(likesInfo).toEqual({
    likesCount: expect.any(Number),
    dislikesCount: expect.any(Number),
    myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
  });

  const extraKeys = Object.keys(likesInfo).filter(
    (key) => !LIKES_INFO_KEYS.includes(key as (typeof LIKES_INFO_KEYS)[number]),
  );
  expect(extraKeys).toEqual([]);
  expect(LIKE_STATUSES).toContain(likesInfo.myStatus);
}

export function expectLikesInfo(
  likesInfo: LikesInfoViewModel,
  expected: LikesInfoViewModel,
) {
  expect(likesInfo).toEqual(expected);
}

class CommentsTestManager {
  async createEntity(
    postId: string,
    accessToken: string,
    content: string = VALID_COMMENT_CONTENT,
    expectedStatus = 201,
  ) {
    const response = await request(app)
      .post(`${ROUTES.posts}/${postId}/comments`)
      .set(bearerAuthHeader(accessToken))
      .send({ content });
    expect(response.status).toBe(expectedStatus);
    return response.body as CommentViewModel;
  }

  async getEntity(
    id: string,
    expectedStatus = 200,
    accessToken?: string,
  ) {
    const req = request(app).get(`${ROUTES.comments}/${id}`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
    }
    const response = await req;
    expect(response.status).toBe(expectedStatus);
    return response.body as CommentViewModel;
  }

  async getEntitiesForPost(
    postId: string,
    expectedStatus = 200,
    accessToken?: string,
    query?: Record<string, string | number>,
  ) {
    const req = request(app).get(`${ROUTES.posts}/${postId}/comments`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
    }
    if (query) {
      req.query(query);
    }
    const response = await req;
    expect(response.status).toBe(expectedStatus);
    return response.body as PaginatedCommentsResponse;
  }

  async updateEntity(
    id: string,
    accessToken: string,
    content: string = "Updated comment with valid length",
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .put(`${ROUTES.comments}/${id}`)
      .set(bearerAuthHeader(accessToken))
      .send({ content });
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async deleteEntity(id: string, accessToken: string, expectedStatus = 204) {
    const response = await request(app)
      .delete(`${ROUTES.comments}/${id}`)
      .set(bearerAuthHeader(accessToken));
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async updateLikeStatus(
    commentId: string,
    accessToken: string,
    likeStatus: LikeStatus,
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .put(`${ROUTES.comments}/${commentId}/like-status`)
      .set(bearerAuthHeader(accessToken))
      .send({ likeStatus });
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const commentsTestManager = new CommentsTestManager();
