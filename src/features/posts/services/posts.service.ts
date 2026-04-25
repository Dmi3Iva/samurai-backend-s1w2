import { WithId } from "mongodb";
import { blogsDatabase, postsDatabase } from "../../../repositories/db";
import {
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
  IPostView,
} from "../models/post.model";
import { blogsRepository } from "../../blogs/repository/blogs.repository";
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
  async getPost(id: string): Promise<IPostType | null> {
    const rawPost = await postsRepository.getPost(id);
    return rawPost ? mapToPostView(rawPost) : null;
  },

  async getPosts() {
    const findResult = await postsRepository.getPosts();
    const mappedResult = await Promise.all(findResult.map(mapToPostView));
    return mappedResult;
  },

  async createPost(postBody: IPostCreateModel): Promise<IPostType | null> {
    const foundBlog = await blogsRepository.findBlog(postBody.blogId);
    if (!foundBlog) return null;

    const newPost = { ...postBody, createdAt: new Date() };
    const createResult = await postsRepository.createPost(newPost);
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
