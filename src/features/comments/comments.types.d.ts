import { WithId } from "mongodb";

export interface ICommentType {
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
  postId: string;
}

export interface ICommentCreateBody {
  content: string;
}

export type ICommentCreateModel = Omit<ICommentType, "id">;

export type IDBCommentType = WithId<Omit<ICommentType, "id">>;

export interface ICommentView extends Omit<ICommentType, "postId"> {
  id: string;
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
