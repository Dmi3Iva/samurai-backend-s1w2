import { injectable, inject } from "inversify";
import { BlogsRepository } from "../../blogs/blogs.repository";
import {
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
  IPostView,
} from "../models/post.model";
import { PostsRepository } from "../repository/posts.repository";

@injectable()
export class PostsService {
  constructor(
    @inject(PostsRepository)
    private postsRepository: PostsRepository,
    @inject(BlogsRepository)
    private blogsRepository: BlogsRepository,
  ) {}

  mapToPostView = async (p: IPostType): Promise<IPostView> => {
    const foundBlog = await this.blogsRepository.findBlog(p.blogId);
    const blogName = foundBlog?.name || "";
    return {
      ...p,
      blogName,
    };
  };

  async getPost(id: string): Promise<IPostView | null> {
    const rawPost = await this.postsRepository.getPost(id);
    if (!rawPost) return null;
    return await this.mapToPostView(rawPost);
  }

  async getPosts(findPostsSearchTerm: IFindPostsSearchTerm) {
    return await this.postsRepository.getPosts(findPostsSearchTerm);
  }

  async createPost(postBody: IPostCreateModel): Promise<IPostView | null> {
    const foundBlog = await this.blogsRepository.findBlog(postBody.blogId);
    if (!foundBlog) return null;

    const newPost = { ...postBody, createdAt: new Date() };
    const createResult = await this.postsRepository.createPost(newPost);
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
    const ifPostsBlogExists = await this.blogsRepository.findBlog(data.blogId);
    if (ifPostsBlogExists) {
      return this.postsRepository.updatePost({ id, data });
    }
    return false;
  }

  async deletePost(id: string): Promise<boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async removeAll() {
    return await this.postsRepository.removeAll();
  }
}
