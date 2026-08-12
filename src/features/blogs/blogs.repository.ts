import { ObjectId, WithId } from "mongodb";
import { injectable } from "inversify";
import {
  type IFindBlogsSearchTerm,
  type UpdateBlogModel,
  type IViewBlog,
  type IBlogType,
  type CreateBlogModelDB,
  type BlogsRouterResponse,
  BlogModel,
} from "./blog.model";

@injectable()
export class BlogsRepository {
  mapToBlogType = (b: WithId<IBlogType>): IViewBlog => ({
    description: b.description,
    name: b.name,
    websiteUrl: b.websiteUrl,
    id: b._id.toString(),
    isMembership: b.isMembership,
    createdAt: b.createdAt,
  });

  async findBlog(id: string): Promise<IBlogType | null> {
    try {
      const foundBlog = await BlogModel.findById(id);
      return foundBlog ? this.mapToBlogType(foundBlog) : null;
    } catch (e) {
      console.log(`error while try to get BLOG with id=${id}`);
      return null;
    }
  }

  async findBlogs(
    findBlogsSearchTerm: IFindBlogsSearchTerm,
  ): Promise<BlogsRouterResponse> {
    const {
      searchNameTerm = null,
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = 1,
      pageSize = 10,
    } = findBlogsSearchTerm;

    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const filter = {
      // searchNameTerm string (query)
      // Search term for blog Name: Name should contains this term in any position
      // Default value : null
      ...(searchNameTerm
        ? {
            name: { $regex: searchNameTerm, $options: "i" },
          }
        : {}),
    };

    const searchResult = await BlogModel.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = searchResult.map(this.mapToBlogType);
    const totalCount = await BlogModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    return {
      items,
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
    };
  }

  async createBlog(createBlogModelData: CreateBlogModelDB): Promise<string> {
    const model = new BlogModel(createBlogModelData);
    const result = await model.save();

    return result.id;
  }

  async deleteBlog(id: string): Promise<boolean> {
    try {
      const removingResult = await BlogModel.deleteOne({
        _id: new ObjectId(id),
      });
      return removingResult.deletedCount === 1;
    } catch (e) {
      console.error(`failed to delete blog with id=${id}`);
      return false;
    }
  }

  async updateBlog({
    id,
    updateBlogModelData,
  }: {
    id: string;
    updateBlogModelData: UpdateBlogModel;
  }): Promise<boolean> {
    try {
      const updateResult = await BlogModel.updateOne(
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
  }
  async removeAll() {
    return await BlogModel.deleteMany({});
  }
}
