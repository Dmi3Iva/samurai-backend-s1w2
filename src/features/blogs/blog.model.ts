import { ObjectId, OptionalId, WithId } from "mongodb";
import { ESortDirection } from "../../types/common.type";
import { model, Schema } from "mongoose";

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

export interface IBlogType {
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
}

export type IDBBLogType = WithId<IBlogType>;

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
  pageNumber?: string;
  pageSize?: string;
}

export interface IFindPostsByBlogSearchTerm {
  pageNumber?: string;
  pageSize?: string;
  sortBy?: string;
  sortDirection?: ESortDirection;
  blogId?: string;
}

const BlogSchema = new Schema<IBlogType>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  websiteUrl: {
    type: String,
    required: true,
  },

  isMembership: {
    type: Boolean,
    required: true,
  },

  createdAt: {
    type: Date,
    required: true,
  },
});

export const BlogModel = model("blog", BlogSchema);
