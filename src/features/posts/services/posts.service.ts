import { WithId } from "mongodb";
import { blogsDatabase, postsDatabase } from "../../../repositories/db";
import {
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
  IPostView,
} from "../models/post.model";
import { blogsRepository } from "../../blogs/blogs.repository";
import { postsRepository } from "../repository/posts.repository";

const mapToPostView = async (p: IPostType): Promise<IPostView> => {
  const foundBlog = await blogsRepository.findBlog(p.blogId);
  const blogName = foundBlog?.name || "";
  return {
    ...p,
    blogName,
  };
};

export const postsService = {
  async getPost(id: string): Promise<IPostView | null> {
    const rawPost = await postsRepository.getPost(id);
    if (!rawPost) return null;
    return await mapToPostView(rawPost);
  },

  async getPosts(findPostsSearchTerm: IFindPostsSearchTerm) {
    return await postsRepository.getPosts(findPostsSearchTerm);
  },

  async createPost(postBody: IPostCreateModel): Promise<IPostView | null> {
    const foundBlog = await blogsRepository.findBlog(postBody.blogId);
    if (!foundBlog) return null;

    const newPost = { ...postBody, createdAt: new Date() };
    const createResult = await postsRepository.createPost(newPost);
    if (!createResult) {
      return null;
    }
    const result = await mapToPostView(createResult);

    return result;
  },

  async updatePost({
    id,
    data,
  }: {
    id: string;
    data: IPostUpadteModel;
  }): Promise<boolean> {
    const ifPostsBlogExists = await blogsRepository.findBlog(data.blogId);
    if (ifPostsBlogExists) {
      return postsRepository.updatePost({ id, data });
    }
    return false;
  },

  async deletePost(id: string): Promise<boolean> {
    return await postsRepository.deletePost(id);
  },

  async removeAll() {
    return await postsRepository.removeAll();
  },
};
