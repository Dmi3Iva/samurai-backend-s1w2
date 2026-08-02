import { ObjectId, WithId } from "mongodb";
import { blogsDatabase } from "../../repositories/database";
import type {
  IFindBlogsSearchTerm,
  UpdateBlogModel,
  IViewBlog,
  IBlogType,
  CreateBlogModelDB,
  BlogsRouterResponse,
} from "./blog.model";

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
      const foundBlog = await blogsDatabase.findOne({ _id: new ObjectId(id) });
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

    const searchResult = blogsDatabase.find(
      filter,
      // sortBy string (query)
      // Default value : createdAt
      // sortDirection string (query)
      // Default value: desc
      // Available values : asc, desc
      // pageNumber integer($int32) (query)
      // pageNumber is number of portions that should be returned
      // Default value : 1
      // PageSize integer($int32) (query)
      // pageSize is portions size that should be returned
      // Default value : 10
      {
        sort: { [sortBy]: sortDirection === "asc" ? 1 : -1 },
        skip,
        limit,
      },
    );

    const items = (await searchResult.toArray()).map(this.mapToBlogType);
    const totalCount = await blogsDatabase.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    return {
      items,
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
    };
  }

  async createBlog(createBlogModelData: CreateBlogModelDB): Promise<ObjectId> {
    const { insertedId } = await blogsDatabase.insertOne(createBlogModelData);

    return insertedId;
  }

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
  }

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
  }
  async removeAll() {
    return await blogsDatabase.deleteMany({});
  }
}

export const blogsRepository = new BlogsRepository();
