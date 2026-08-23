import { injectable, inject } from "inversify";
import { BlogsRepository } from "../../blogs/blogs.repository";
import {
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostUpadteModel,
  IPostView,
  IViewPostType,
} from "../models/post.model";
import { PostsRepository } from "../repository/posts.repository";
import { ELikeStatus } from "../../likes/like.model";
import { PostLikeRepository } from "../../post-likes/post-like.repository";

@injectable()
export class PostsService {
  constructor(
    @inject(PostsRepository)
    private postsRepository: PostsRepository,
    @inject(BlogsRepository)
    private blogsRepository: BlogsRepository,
    @inject(PostLikeRepository) private postLikeRepository: PostLikeRepository,
  ) {}

  // TODO:: pass userId;
  mapToPostView = async (
    p: IViewPostType,
    userId: string | undefined,
  ): Promise<IPostView> => {
    const foundBlog = await this.blogsRepository.findBlog(p.blogId);
    const extendedLikesInfo = await this.postLikeRepository.getLikesInfo({
      userId,
      postId: p.id,
    });
    const blogName = foundBlog?.name || "";
    return {
      ...p,
      blogName,
      extendedLikesInfo,
    };
  };

  async getPost(
    id: string,
    userId: string | undefined,
  ): Promise<IPostView | null> {
    const rawPost = await this.postsRepository.getPost(id);
    if (!rawPost) return null;
    return await this.mapToPostView(rawPost, userId);
  }

  async getPosts(
    findPostsSearchTerm: IFindPostsSearchTerm,
    userId: string | undefined,
  ) {
    return await this.postsRepository.getPosts(findPostsSearchTerm, userId);
  }

  async createPost(
    postBody: IPostCreateModel,
    userId: string | undefined,
  ): Promise<IPostView | null> {
    const foundBlog = await this.blogsRepository.findBlog(postBody.blogId);
    if (!foundBlog) return null;

    const newPost = { ...postBody, createdAt: new Date() };
    const createResult = await this.postsRepository.createPost(newPost);
    if (!createResult) {
      return null;
    }
    const result = await this.mapToPostView(createResult, userId);

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

  // async setLike({
  //   userId,
  //   postId,
  //   likeStatus,
  // }: {
  //   userId: string;
  //   postId: string;
  //   likeStatus: ELikeStatus;
  // }) {}

  async removeAll() {
    return await this.postsRepository.removeAll();
  }
}
