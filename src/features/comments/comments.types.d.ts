import { WithId } from "mongodb";
import { ELikeStatus } from "../likes/like.model";

export interface ICommentType {
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
  postId: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
  };
}

export interface ICommentCreateBody {
  content: string;
}

export type ILikeStatusPutBody = { likeStatus: ELikeStatus; commentId: string };

export type ICommentCreateModel = Omit<ICommentType, "id">;

export type IDBCommentType = WithId<Omit<ICommentType, "id">>;

export interface ICommentView extends Omit<
  ICommentType,
  "postId" | "likesInfo"
> {
  id: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: ELikeStatus;
  };
}

export type IPostCreateModel = Omit<
  ICommentType,
  "createdAt",
  "commentatorInfo"
>;

export interface IFindCommentsSearchTerm {
  searchNameTerm?: string | null;
  sortBy?: string;
  sortDirection?: ESortDirection;
  pageNumber?: string;
  pageSize?: string;
}

export interface GetCommentsResponse {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: ICommentView[];
}
