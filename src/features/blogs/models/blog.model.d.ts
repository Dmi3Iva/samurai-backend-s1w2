import { OptionalId } from "mongodb";

export interface IViewBlog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
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
  name: string;
  description: string;
  websiteUrl: string;
}
