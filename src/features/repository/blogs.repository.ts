import type { CreateBlogModel } from "../blogs/models";

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
    if (findBlogsSearchTerm.name) {
      searchResult = searchResult.filter(
        (i) => i.name.indexOf(findBlogsSearchTerm.name) > -1,
      );
    }
    if (findBlogsSearchTerm.description) {
    }
    if (findBlogsSearchTerm.websiteUrl) {
    }

    return searchResult;
  },
  createBlog(createBlogModelData: CreateBlogModel): void {
    const newBlog = { ...createBlogModelData, id: String(new Date()) };
    blogs.push(newBlog);
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
  removeAll() {
    blogs.splice(0, blogs.length);
  },
};
