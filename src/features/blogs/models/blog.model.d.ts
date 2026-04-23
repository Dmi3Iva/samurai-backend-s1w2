export interface IViewBlog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
}

export interface IBlogType {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
}

export interface CreateBlogModel {
  name: string;
  description: string;
  websiteUrl: string;
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
