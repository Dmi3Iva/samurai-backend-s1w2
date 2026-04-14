export interface ViewBlog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
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
