import { WithId } from "mongodb";
import { blogsDatabase } from "../../../repositories/db";
import type {
  CreateBlogModel,
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
  IBlogType,
} from "../models/blog.model";

export interface DBType {
  blogs: IBlogType[];
}

const mapToBlogType = (b: WithId<IBlogType>): IViewBlog => ({
  description: b.description,
  name: b.name,
  websiteUrl: b.websiteUrl,
  id: b.id,
});

export const blogsRepository = {
  async findBlog(id?: string): Promise<IBlogType | null> {
    if (!id) return null;

    const foundBlog = await blogsDatabase.findOne({ id });
    return foundBlog ? mapToBlogType(foundBlog) : null;
  },

  async findBlogs(
    findBlogsSearchTerm?: IFindBlogsSearchTerm,
  ): Promise<IBlogType[]> {
    if (!findBlogsSearchTerm) return [];

    let searchResult = await blogsDatabase.find({}).toArray();

    return searchResult.map(mapToBlogType);
  },

  async createBlog(createBlogModelData: CreateBlogModel): Promise<IBlogType> {
    const newBlogData = {
      ...createBlogModelData,
      id: String(Number(new Date())),
    };
    await blogsDatabase.insertOne(newBlogData);

    return mapToBlogType(newBlogData as WithId<IBlogType>);
  },

  async deleteBlog(id?: string): Promise<boolean> {
    if (!id) return false;
    const removingResult = await blogsDatabase.deleteOne({ id });
    return removingResult.deletedCount === 1;
  },

  async updateBlog({
    id,
    updateBlogModelData,
  }: {
    id?: string;
    updateBlogModelData: UpdateBlogModel;
  }): Promise<boolean> {
    if (!id) return false;

    const updateResult = await blogsDatabase.updateOne(
      { id },
      {
        $set: {
          ...updateBlogModelData,
        },
      },
    );

    return updateResult.matchedCount === 1;
  },
  async removeAll() {
    return await blogsDatabase.deleteMany({});
  },
};
