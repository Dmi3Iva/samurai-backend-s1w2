import { ObjectId, WithId } from "mongodb";
import { blogsDatabase, postsDatabase } from "../../../repositories/db";
import {
  GetPostsResponse,
  IFindPostsSearchTerm,
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
} from "../models/post.model";
import { blogsRepository } from "../../blogs/repository/blogs.repository";

// TODO:: move to separate file
export const mapToPostType = async (p: IPostType): IPostType => {
  const blog = await blogsRepository.findBlog(p.blogId);

  return {
    id: p._id?.toString() || "not-existing-id",
    title: p.title,
    shortDescription: p.shortDescription,
    content: p.content,
    blogId: p.blogId,
    createdAt: p.createdAt,
    blogName: blog ? blog.name : "no-name",
  };
};

export const postsRepository = {
  async getPost(id: string): Promise<IPostType | null> {
    try {
      const findResult = await postsDatabase.findOne({ _id: new ObjectId(id) });
      return findResult ? await mapToPostType(findResult) : null;
    } catch (e) {
      console.log(`error while try to get post with id=${id}`);
      return null;
    }
  },

  async getPosts(
    findPostsSearchTerm: IFindPostsSearchTerm,
  ): Promise<GetPostsResponse> {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
      blogId,
    } = findPostsSearchTerm;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const filter = blogId ? { blogId } : {};

    const findResult = postsDatabase.find(filter, {
      sort: { [sortBy]: sortDirection === "asc" ? 1 : -1 },
      skip,
      limit,
    });

    const rawItems = await findResult.toArray();
    const items = await Promise.all(rawItems.map(mapToPostType));
    const page = pageNumber;
    const totalCount = await postsDatabase.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      items,
      page,
      pageSize,
      pagesCount,
      totalCount,
    };
  },

  async createPost(postBody: IPostCreateModel): Promise<IPostType> {
    try {
      const newPost = { ...postBody, createdAt: new Date() };
      const { insertedId } = await postsDatabase.insertOne({
        ...newPost,
      });

      newPost._id = insertedId;

      return await mapToPostType(newPost as WithId<IPostType>);
    } catch (e) {
      console.error("failed to create post", e);
      return false;
    }
  },

  async updatePost({
    id,
    data: updatedPost,
  }: {
    id: string;
    data: IPostUpadteModel;
  }): Promise<boolean> {
    try {
      const updateResult = await postsDatabase.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedPost },
      );

      return updateResult.matchedCount === 1;
    } catch (e) {
      console.error(`failed to update posts with id=${id}`);
      return false;
    }
  },

  async deletePost(id: string): Promise<boolean> {
    try {
      const deleteResult = await postsDatabase.deleteOne({
        _id: new ObjectId(id),
      });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      console.error(`failed to delete post with id=${id}`);
      return false;
    }
  },

  async removeAllByBlogs(blogId: string) {
    return await postsDatabase.deleteMany({ blogId });
  },

  async removeAll() {
    return await postsDatabase.deleteMany({});
  },
};
