import { ESortDirection } from "../../../types/common.type";
import { WithId } from "mongodb";

export interface IPostType {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
}

export interface IViewPostType extends IPostType {
  id: string;
}

export type IDBPostType = WithId<IPostType>;

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
