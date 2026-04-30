import { ESortDirection } from "../../../types/common.type";

export interface IPostTypeWithoutId {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  createdAt: Date;
}

export type IPostType = OptionalId<IPostTypeWithoutId>;

export type IPostCreateModel = Omit<IPostType, "_id", "createdAt">;
export type IPostUpadteModel = IPostCreateModel;
export interface IPostView extends IPostType {
  blogName: string;
}

export interface GetPostsResponse {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IPostView[];
}

export interface IFindPostsSearchTerm {
  pageNumber?: string;
  pageSize?: string;
  sortBy?: string;
  sortDirection?: ESortDirection;
  blogId?: string;
}
