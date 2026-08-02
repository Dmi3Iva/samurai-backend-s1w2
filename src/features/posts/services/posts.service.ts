import {
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
  IPostView,
} from "../models/post.model";
import { blogsRepository } from "../../blogs/blogs.repository";
import {
  PostsRepository,
  postsRepository,
} from "../repository/posts.repository";

export class PostsService {
  constructor(private postsRepository: PostsRepository) {}

  mapToPostView = async (p: IPostType): Promise<IPostView> => {
    const foundBlog = await blogsRepository.findBlog(p.blogId);
    const blogName = foundBlog?.name || "";
    return {
      ...p,
      blogName,
    };
  };

  async getPost(id: string): Promise<IPostView | null> {
    const rawPost = await postsRepository.getPost(id);
    if (!rawPost) return null;
    return await this.mapToPostView(rawPost);
  }

  async getPosts(findPostsSearchTerm: IFindPostsSearchTerm) {
    return await postsRepository.getPosts(findPostsSearchTerm);
  }

  async createPost(postBody: IPostCreateModel): Promise<IPostView | null> {
    const foundBlog = await blogsRepository.findBlog(postBody.blogId);
    if (!foundBlog) return null;

    const newPost = { ...postBody, createdAt: new Date() };
    const createResult = await postsRepository.createPost(newPost);
    if (!createResult) {
      return null;
    }
    const result = await this.mapToPostView(createResult);

    return result;
  }

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
  }

  async deletePost(id: string): Promise<boolean> {
    return await postsRepository.deletePost(id);
  }

  async removeAll() {
    return await postsRepository.removeAll();
  }
}

export const postsService = new PostsService(postsRepository);
