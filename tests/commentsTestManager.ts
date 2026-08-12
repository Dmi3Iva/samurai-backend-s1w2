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

interface PaginatedCommentsResponse {
  items: CommentViewModel[];
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
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
  ) {
    const req = request(app).get(`${ROUTES.posts}/${postId}/comments`);
    if (accessToken) {
      req.set(bearerAuthHeader(accessToken));
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
