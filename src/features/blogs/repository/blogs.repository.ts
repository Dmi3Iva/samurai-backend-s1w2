import type { CreateBlogModel, UpdateBlogModel } from "../models/blog.model";

export interface BlogType {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
}

export interface DBType {
  blogs: BlogType[];
}

const blogs: BlogType[] = [];

// TODO:: move to models
export interface IFindBlogsSearchTerm {
  name: string;
  description: string;
  websiteUrl: string;
}

export const blogsRepository = {
  findBlogs(findBlogsSearchTerm?: IFindBlogsSearchTerm): BlogType[] {
    if (!findBlogsSearchTerm) return blogs;

    let searchResult: BlogType[] = blogs;

    return searchResult;
  },
  createBlog(createBlogModelData: CreateBlogModel): BlogType {
    const newBlog = { ...createBlogModelData, id: String(Number(new Date())) };
    blogs.push(newBlog);
    return newBlog;
  },
  findBlog(id?: string) {
    const foundBlog = blogs.find(({ id: blogId }) => id === blogId);
    return foundBlog;
  },
  deleteBlog(id?: string): boolean {
    const idToRemove = blogs.findIndex(({ id: blogId }) => id === blogId);
    if (idToRemove === -1) return false;

    blogs.splice(idToRemove, 1);
    return true;
  },
  updateBlog({
    id,
    updateBlogModelData,
  }: {
    id?: string;
    updateBlogModelData: UpdateBlogModel;
  }): BlogType | null {
    const foundBlog = blogs.find(({ id: blogId }) => id === blogId);
    if (!foundBlog) return null;

    Object.assign(foundBlog, updateBlogModelData);

    return foundBlog;
  },
  removeAll() {
    blogs.splice(0, blogs.length);
  },
};
