import { WithId } from "mongodb";
import { postsDatabase } from "../../../repositories/db";
import {
  IPostCreateModel,
  IPostType,
  IPostUpadteModel,
} from "../models/post.model";

const mapToPostType = (p: WithId<IPostType>): IPostType => ({
  id: p.id,
  title: p.title,
  shortDescription: p.shortDescription,
  content: p.content,
  blogId: p.blogId,
});

export const postsRepository = {
  async getPost(id: string): Promise<IPostType | null> {
    const findResult = await postsDatabase.findOne({ id });
    return findResult ? mapToPostType(findResult) : null;
  },

  async getPosts() {
    const findResult = await postsDatabase.find({}).toArray();
    return findResult.map(mapToPostType);
  },

  async createPost(postBody: IPostCreateModel): Promise<IPostType> {
    const id = String(Number(new Date()));
    const newPost = { ...postBody, id };
    await postsDatabase.insertOne(newPost);

    return mapToPostType(newPost as WithId<IPostType>);
  },

  async updatePost({
    id,
    updatedPost,
  }: {
    id: string;
    updatedPost: IPostUpadteModel;
  }): Promise<boolean> {
    const updateResult = await postsDatabase.updateOne(
      { id },
      { $set: updatedPost },
    );

    return updateResult.matchedCount === 1;
  },

  async deletePost(id: string): Promise<boolean> {
    const deleteResult = await postsDatabase.deleteOne({ id });

    return deleteResult.deletedCount === 1;
  },

  async removeAll() {
    return await postsDatabase.deleteMany({});
  },
};
