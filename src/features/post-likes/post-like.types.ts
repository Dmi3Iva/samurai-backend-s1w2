import { EPostLikeStatus } from "./post-like.model";

export interface IPostLikeStatusDTO {
  postId: string;
  likeStatus: EPostLikeStatus;
}

export interface IExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: EPostLikeStatus;
  newestLikes: {
    addedAt: Date;
    userId: string;
    login: string;
  }[];
}
