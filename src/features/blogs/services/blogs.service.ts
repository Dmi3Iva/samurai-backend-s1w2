import { WithId } from "mongodb";
import { blogsDatabase } from "../../../repositories/db";
import type {
  CreateBlogModel,
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
  IBlogType,
} from "../models/blog.model";
import { IS_MEMBERSHIP_DEFAULT_VALUE } from "../../../consants/routes.conts";
import { blogsRepository } from "../repository/blogs.repository";
import { postsRepository } from "../../posts/repository/posts.repository";

const mapToBlogType = (b: IBlogType): IViewBlog => ({
  description: b.description,
  name: b.name,
  websiteUrl: b.websiteUrl,
  id: b._id?.toString() || "empty id",
  isMembership: b.isMembership,
  createdAt: b.createdAt,
});

export const blogsService = {
  async findBlog(id: string): Promise<IBlogType | null> {
    return await blogsRepository.findBlog(id);
  },

  async findBlogs(
    findBlogsSearchTerm?: IFindBlogsSearchTerm,
  ): Promise<IViewBlog[]> {
    return await blogsRepository.findBlogs(findBlogsSearchTerm);
  },

  async createBlog(createBlogModelData: CreateBlogModel): Promise<IBlogType> {
    const newBlogData = {
      ...createBlogModelData,
      isMembership: IS_MEMBERSHIP_DEFAULT_VALUE,
      createdAt: new Date(),
    };
    const _id = await blogsRepository.createBlog(newBlogData);

    return mapToBlogType({ ...newBlogData, _id });
  },

  async deleteBlog(id: string): Promise<boolean> {
    postsRepository.removeAllByBlogs(id);
    return await blogsRepository.deleteBlog(id);
  },

  async updateBlog({
    id,
    updateBlogModelData,
  }: {
    id: string;
    updateBlogModelData: UpdateBlogModel;
  }): Promise<boolean> {
    return await blogsRepository.updateBlog({ id, updateBlogModelData });
  },
  async removeAll() {
    return await blogsDatabase.deleteMany({});
  },
};
