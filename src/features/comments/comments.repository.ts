import { ObjectId } from "mongodb";
import { commentsDatabase } from "../../repositories/database";
import {
  GetCommentsResponse,
  ICommentCreateModel,
  ICommentView,
  IDBCommentType,
  IFindCommentsSearchTerm,
} from "./comments.models";

const mapDbCommentToView = (dbComment: IDBCommentType): ICommentView => {
  const commentatorInfo: ICommentView["commentatorInfo"] = {
    userId: dbComment.commentatorInfo.userId,
    userLogin: dbComment.commentatorInfo.userLogin,
  };

  return {
    content: dbComment.content,
    createdAt: dbComment.createdAt,
    commentatorInfo,
    id: dbComment._id.toString(),
  };
};

export const commentsRepository = {
  async getCommentById(id: string): Promise<IDBCommentType | null> {
    try {
      const findResult = await commentsDatabase.findOne({
        _id: new ObjectId(id),
      });
      return findResult ?? null;
    } catch (e) {
      console.error(`error while try to get comment with id = ${id}`);
      return null;
    }
  },
  async removeById(id: string): Promise<boolean> {
    try {
      const removeResult = await commentsDatabase.deleteOne({
        _id: new ObjectId(id),
      });
      const isRemoved = removeResult.deletedCount === 1;
      return isRemoved;
    } catch (e) {
      console.error(`can't delet comment with id ${id}`);
      return false;
    }
  },

  async getComments(
    findPostsSearchTerm: IFindCommentsSearchTerm,
    postId: string,
  ): Promise<GetCommentsResponse> {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = findPostsSearchTerm;
    const filter = { postId };
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const findResult = commentsDatabase.find(filter, {
      sort: { [sortBy]: sortDirection === "asc" ? 1 : -1 },
      skip,
      limit,
    });

    const rawItems = await findResult.toArray();
    const items = await Promise.all(rawItems.map(mapDbCommentToView));
    const page = Number(pageNumber);
    const totalCount = await commentsDatabase.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    return {
      items,
      page,
      pageSize: Number(pageSize),
      pagesCount,
      totalCount,
    };
  },

  async createComment(
    commentModel: ICommentCreateModel,
  ): Promise<string | null> {
    try {
      const { insertedId } = await commentsDatabase.insertOne(commentModel);

      return insertedId.toString();
    } catch (e) {
      console.error("failed to create post", e);
      return null;
    }
  },

  async removeAll() {
    return await commentsDatabase.deleteMany({});
  },

  async updateComment({
    commentId,
    updatedCommentData,
  }: {
    commentId: string;
    updatedCommentData: { content: string };
  }) {
    try {
      const result = await commentsDatabase.updateOne(
        { _id: new ObjectId(commentId) },
        { $set: { content: updatedCommentData.content } },
      );

      return result.modifiedCount === 1;
    } catch (e) {
      console.error("failed to update comment", commentId);
      return false;
    }
  },
};
