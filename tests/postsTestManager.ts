import { expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import type { IPostCreateModel } from "../src/features/posts/models/post.model";
import { ROUTES, bearerAuthHeader } from "./test.const";
import type { LikeStatus } from "./commentsTestManager";

const ADMIN_AUTH_HEADER = {
  Authorization: "Basic YWRtaW46cXdlcnR5",
};

export interface LikeDetailsViewModel {
  addedAt: string;
  userId: string | null;
  login: string | null;
}

export interface ExtendedLikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: LikeDetailsViewModel[];
}

export interface PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewModel;
}

export const DEFAULT_EXTENDED_LIKES_INFO: ExtendedLikesInfoViewModel = {
  likesCount: 0,
  dislikesCount: 0,
  myStatus: "None",
  newestLikes: [],
};

const POST_VIEW_KEYS = [
  "id",
  "title",
  "shortDescription",
  "content",
  "blogId",
  "blogName",
  "createdAt",
  "extendedLikesInfo",
] as const;

const EXTENDED_LIKES_KEYS = [
  "likesCount",
  "dislikesCount",
  "myStatus",
  "newestLikes",
] as const;

const LIKE_DETAIL_KEYS = ["addedAt", "userId", "login"] as const;

const ISO_DATE =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)/;

interface PaginatedPostsResponse {
  items: PostViewModel[];
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
}

/** swagger h12.PostViewModel — remote checker requires extendedLikesInfo */
export function expectPostView(
  post: PostViewModel,
  expected: {
    id?: string;
    title?: string;
    shortDescription?: string;
    content?: string;
    blogId?: string;
    blogName?: string;
    extendedLikesInfo?: ExtendedLikesInfoViewModel;
  } = {},
) {
  expect(post).toEqual({
    id: expected.id ?? expect.any(String),
    title: expected.title ?? expect.any(String),
    shortDescription: expected.shortDescription ?? expect.any(String),
    content: expected.content ?? expect.any(String),
    blogId: expected.blogId ?? expect.any(String),
    blogName: expected.blogName ?? expect.any(String),
    createdAt: expect.any(String),
    extendedLikesInfo: expected.extendedLikesInfo ?? {
      likesCount: expect.any(Number),
      dislikesCount: expect.any(Number),
      myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
      newestLikes: expect.any(Array),
    },
  });

  const extraKeys = Object.keys(post).filter(
    (key) => !POST_VIEW_KEYS.includes(key as (typeof POST_VIEW_KEYS)[number]),
  );
  expect(extraKeys).toEqual([]);

  expectExtendedLikesInfoSchema(post.extendedLikesInfo);
}

export function expectExtendedLikesInfoSchema(
  likesInfo: ExtendedLikesInfoViewModel,
) {
  expect(likesInfo).toEqual({
    likesCount: expect.any(Number),
    dislikesCount: expect.any(Number),
    myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
    newestLikes: expect.any(Array),
  });

  const extraKeys = Object.keys(likesInfo).filter(
    (key) =>
      !EXTENDED_LIKES_KEYS.includes(key as (typeof EXTENDED_LIKES_KEYS)[number]),
  );
  expect(extraKeys).toEqual([]);

  for (const like of likesInfo.newestLikes) {
    expect(like).toEqual({
      addedAt: expect.stringMatching(ISO_DATE),
      userId: expect.anything(),
      login: expect.anything(),
    });
    const detailExtra = Object.keys(like).filter(
      (key) =>
        !LIKE_DETAIL_KEYS.includes(key as (typeof LIKE_DETAIL_KEYS)[number]),
    );
    expect(detailExtra).toEqual([]);
  }
}

export function expectExtendedLikesInfo(
  likesInfo: ExtendedLikesInfoViewModel,
  expected: ExtendedLikesInfoViewModel,
) {
  expect(likesInfo).toEqual(expected);
}

/** Remote checker requires milliseconds in createdAt (see postSchema in automaton). */
export const AUTOMATON_CREATED_AT =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

export const AUTOMATON_POST_SCHEMA = {
  id: expect.any(String),
  title: expect.any(String),
  shortDescription: expect.any(String),
  content: expect.any(String),
  blogId: expect.any(String),
  blogName: expect.any(String),
  createdAt: expect.stringMatching(AUTOMATON_CREATED_AT),
  extendedLikesInfo: {
    likesCount: expect.any(Number),
    dislikesCount: expect.any(Number),
    myStatus: expect.stringMatching(/^Like$|^Dislike$|^None$/),
    newestLikes: expect.any(Array),
  },
};

export function expectAutomatonPostSchema(post: PostViewModel) {
  expect(post).toEqual(AUTOMATON_POST_SCHEMA);
}

export function assertLikeStatusRouteRegistered(
  response: { status: number; text?: string; type?: string },
) {
  expect(response.status).not.toBe(404);
  if (typeof response.text === "string") {
    expect(response.text).not.toMatch(/Cannot PUT \/posts\/.+\/like-status/);
  }
}

class PostsTestManager {
  async createEntity(data: IPostCreateModel, expectedStatus = 201) {
    const response = await request(app)
      .post(`${ROUTES.posts}`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body as PostViewModel;
  }

  async createEntityViaBlog(
    blogId: string,
    data: Omit<IPostCreateModel, "blogId">,
    expectedStatus = 201,
  ) {
    const response = await request(app)
      .post(`${ROUTES.blogs}/${blogId}/posts`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body as PostViewModel;
  }

  async deleteEntity(id: string, expectedStatus = 204) {
    const response = await request(app)
      .delete(`${ROUTES.posts}/${id}`)
      .set(ADMIN_AUTH_HEADER);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async updateEntity(
    id: string,
    data: IPostCreateModel,
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .put(`${ROUTES.posts}/${id}`)
      .set(ADMIN_AUTH_HEADER)
      .send(data);
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }

  async getEntity(
    id: string,
    expectedStatus = 200,
    accessToken?: string,
  ) {
    const req = request(app).get(`${ROUTES.posts}/${id}`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
    }
    const response = await req;
    expect(response.status).toBe(expectedStatus);
    return response.body as PostViewModel;
  }

  async getEntities(expectedStatus = 200, accessToken?: string) {
    const req = request(app).get(`${ROUTES.posts}`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
    }
    const response = await req;
    expect(response.status).toBe(expectedStatus);
    return response.body as PaginatedPostsResponse;
  }

  async getEntitiesByBlog(
    blogId: string,
    expectedStatus = 200,
    accessToken?: string,
  ) {
    const req = request(app).get(`${ROUTES.blogs}/${blogId}/posts`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
    }
    const response = await req;
    expect(response.status).toBe(expectedStatus);
    return response.body as PaginatedPostsResponse;
  }

  async updateLikeStatus(
    postId: string,
    accessToken: string,
    likeStatus: LikeStatus,
    expectedStatus = 204,
  ) {
    const response = await request(app)
      .put(`${ROUTES.posts}/${postId}/like-status`)
      .set(bearerAuthHeader(accessToken))
      .send({ likeStatus });
    expect(response.status).toBe(expectedStatus);
    return response.body;
  }
}

export const postsTestManager = new PostsTestManager();
