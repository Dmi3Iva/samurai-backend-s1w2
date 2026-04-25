import { ObjectId, WithId } from "mongodb";
import { blogsDatabase } from "../../../repositories/db";
import type {
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
  IBlogType,
  CreateBlogModelDB,
} from "../models/blog.model";

const mapToBlogType = (b: WithId<IBlogType>): IViewBlog => ({
  description: b.description,
  name: b.name,
  websiteUrl: b.websiteUrl,
  id: b._id.toString(),
  isMembership: b.isMembership,
  createdAt: b.createdAt,
});

export const blogsRepository = {
  async findBlog(id: string): Promise<IBlogType | null> {
    try {
      const foundBlog = await blogsDatabase.findOne({ _id: new ObjectId(id) });
      return foundBlog ? mapToBlogType(foundBlog) : null;
    } catch (e) {
      console.log(`error while try to get BLOG with id=${id}`);
      return null;
    }
  },

  async findBlogs(
    findBlogsSearchTerm?: IFindBlogsSearchTerm,
  ): Promise<IViewBlog[]> {
    if (!findBlogsSearchTerm) return [];

    let searchResult = await blogsDatabase.find({}).toArray();

    return searchResult.map(mapToBlogType);
  },

  async createBlog(createBlogModelData: CreateBlogModelDB): Promise<ObjectId> {
    const { insertedId } = await blogsDatabase.insertOne(createBlogModelData);

    return insertedId;
  },

  async deleteBlog(id: string): Promise<boolean> {
    try {
      const removingResult = await blogsDatabase.deleteOne({
        _id: new ObjectId(id),
      });
      return removingResult.deletedCount === 1;
    } catch (e) {
      console.error(`failed to delete blog with id=${id}`);
      return false;
    }
  },

  async updateBlog({
    id,
    updateBlogModelData,
  }: {
    id: string;
    updateBlogModelData: UpdateBlogModel;
  }): Promise<boolean> {
    try {
      const updateResult = await blogsDatabase.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateBlogModelData,
          },
        },
      );

      return updateResult.matchedCount === 1;
    } catch (e) {
      console.error(`failed to update blog with id=${id}`);
      return false;
    }
  },
  async removeAll() {
    return await blogsDatabase.deleteMany({});
  },
};
