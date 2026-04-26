import { ObjectId, WithId } from "mongodb";
import { blogsDatabase, postsDatabase } from "../../../repositories/db";
import {
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
} from "../models/post.model";

// buis
const mapToPostType = (p: IPostType): IPostType => ({
  id: p._id?.toString() || "not-existing-id",
  title: p.title,
  shortDescription: p.shortDescription,
  content: p.content,
  blogId: p.blogId,
  createdAt: p.createdAt,
});

export const postsRepository = {
  async getPost(id: string): Promise<IPostType | null> {
    try {
      const findResult = await postsDatabase.findOne({ _id: new ObjectId(id) });
      return findResult ? mapToPostType(findResult) : null;
    } catch (e) {
      console.log(`error while try to get post with id=${id}`);
      return null;
    }
  },

  async getPosts() {
    const findResult = await postsDatabase.find({}).toArray();
    return findResult.map(mapToPostType);
  },

  async createPost(postBody: IPostCreateModel): Promise<IPostType> {
    try {
      const newPost = { ...postBody, createdAt: new Date() };
      const { insertedId } = await postsDatabase.insertOne({
        ...newPost,
      });

      newPost._id = insertedId;

      return mapToPostType(newPost as WithId<IPostType>);
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
