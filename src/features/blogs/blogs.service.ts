import {
  type CreateBlogModel,
  type IFindBlogsSearchTerm,
  type UpdateBlogModel,
  type IViewBlog,
  type IBlogType,
  type BlogsRouterResponse,
  type IFindPostsByBlogSearchTerm,
  type IDBBLogType,
  BlogModel,
} from "./blog.model";
import { IS_MEMBERSHIP_DEFAULT_VALUE } from "../../consants/routes.conts";
import { BlogsRepository } from "./blogs.repository";
import { BlogIdParam } from "../../types/common.type";
import { PostsRepository } from "../posts/repository/posts.repository";
import { inject, injectable } from "inversify";
import { ObjectId } from "mongodb";
import { IPostCreateModel } from "../posts/models/post.model";

@injectable()
export class BlogsService {
  constructor(
    @inject(BlogsRepository)
    private blogsRepository: BlogsRepository,
    @inject(PostsRepository)
    private postsRepository: PostsRepository,
  ) {}

  mapToBlogType = (b: IDBBLogType): IViewBlog => ({
    description: b.description,
    name: b.name,
    websiteUrl: b.websiteUrl,
    id: b._id?.toString() || "empty id",
    isMembership: b.isMembership,
    createdAt: b.createdAt,
  });

  async findBlog(id: string): Promise<IBlogType | null> {
    return await this.blogsRepository.findBlog(id);
  }

  async findBlogs(
    findBlogsSearchTerm: IFindBlogsSearchTerm,
  ): Promise<BlogsRouterResponse> {
    return await this.blogsRepository.findBlogs(findBlogsSearchTerm);
  }

  async findPostsByBlogId(
    blogId: string,
    searchTerm: IFindPostsByBlogSearchTerm,
  ) {
    const blog = await this.blogsRepository.findBlog(blogId);

    if (!blog) return null;
    return await this.postsRepository.getPosts({
      ...searchTerm,
      blogId,
    });
  }

  async createBlog(createBlogModelData: CreateBlogModel): Promise<IBlogType> {
    const newBlogData = {
      ...createBlogModelData,
      isMembership: IS_MEMBERSHIP_DEFAULT_VALUE,
      createdAt: new Date(),
    };
    const _id = await this.blogsRepository.createBlog(newBlogData);

    return this.mapToBlogType({ ...newBlogData, _id: new ObjectId(_id) });
  }

  async createPost(data: IPostCreateModel & BlogIdParam) {
    const blog = await this.blogsRepository.findBlog(data.blogId);

    if (!blog) return null;

    const createdPost = await this.postsRepository.createPost(data);
    return createdPost;
  }

  async deleteBlog(id: string): Promise<boolean> {
    this.postsRepository.removeAllByBlogs(id);
    return await this.blogsRepository.deleteBlog(id);
  }

  async updateBlog({
    id,
    updateBlogModelData,
  }: {
    id: string;
    updateBlogModelData: UpdateBlogModel;
  }): Promise<boolean> {
    return await this.blogsRepository.updateBlog({ id, updateBlogModelData });
  }

  async removeAll() {
    return await BlogModel.deleteMany({});
  }
}
