import { OptionalId } from "mongodb";
import { ESortDirection } from "../../../types/common.type";

export interface IViewBlog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
}

export interface BlogsRouterResponse {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IViewBlog[];
}

export interface IBlogTypeWithoutId {
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
}

export type IBlogType = OptionalId<IBlogTypeWithoutId>;

export interface CreateBlogModel {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface CreateBlogModelDB extends CreateBlogModel {
  createdAt: Date;
  isMembership: boolean;
}

export interface UpdateBlogModel {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface IFindBlogsSearchTerm {
  searchNameTerm?: string | null;
  sortBy?: string;
  sortDirection?: ESortDirection;
  pageNumber?: number;
  pageSize?: number;
}

export interface IFindPostsByBlogSearchTerm {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: ESortDirection;
  blogId?: string;
}
