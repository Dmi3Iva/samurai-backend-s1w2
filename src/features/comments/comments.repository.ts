import { ObjectId } from "mongodb";
import {
  GetCommentsResponse,
  ICommentCreateModel,
  ICommentView,
  IDBCommentType,
  IFindCommentsSearchTerm,
} from "./comments.types";
import { injectable } from "inversify";
import { CommentModel } from "./comments.models";
import { ELikeStatus } from "../likes/like.model";

@injectable()
export class CommentsRepository {
  mapDbCommentToView(dbComment: IDBCommentType): ICommentView {
    const commentatorInfo: ICommentView["commentatorInfo"] = {
      userId: dbComment.commentatorInfo.userId,
      userLogin: dbComment.commentatorInfo.userLogin,
    };

    return {
      content: dbComment.content,
      createdAt: dbComment.createdAt,
      commentatorInfo,
      id: dbComment._id.toString(),
      likesInfo: {
        likesCount: dbComment.likesInfo?.likesCount,
        dislikesCount: dbComment.likesInfo?.dislikesCount,
        myStatus: ELikeStatus.None,
      },
    };
  }

  async getCommentById(id: string): Promise<IDBCommentType | null> {
    try {
      const findResult = await CommentModel.findById(id).lean();

      return findResult;
    } catch (e) {
      console.error(`error while try to get comment with id = ${id}`);
      return null;
    }
  }
  async removeById(id: string): Promise<boolean> {
    try {
      const removeResult = await CommentModel.deleteOne({
        _id: new ObjectId(id),
      });
      const isRemoved = removeResult.deletedCount === 1;
      return isRemoved;
    } catch (e) {
      console.error(`can't delet comment with id ${id}`);
      return false;
    }
  }

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

    const rawItems = await CommentModel.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = rawItems.map(this.mapDbCommentToView);
    const page = Number(pageNumber);
    const totalCount = await CommentModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    return {
      items,
      page,
      pageSize: Number(pageSize),
      pagesCount,
      totalCount,
    };
  }

  async createComment(payload: ICommentCreateModel): Promise<string | null> {
    try {
      const model = new CommentModel(payload);
      await model.save();

      return model.id;
    } catch (e) {
      console.error("failed to create post", e);
      return null;
    }
  }

  async removeAll() {
    return await CommentModel.deleteMany({});
  }

  async updateComment({
    commentId,
    updatedCommentData,
  }: {
    commentId: string;
    updatedCommentData: { content: string };
  }) {
    try {
      const m = await CommentModel.findById(commentId);
      if (m === null) return false;

      m.content = updatedCommentData.content;

      await m.save();
      return true;
    } catch (e) {
      console.error("failed to update comment", commentId);
      return false;
    }
  }

  async getLikesCount(commentId: string): Promise<[number, number]> {
    try {
      const comment = await CommentModel.findById(commentId);

      if (!comment || !comment?.likesInfo) return [0, 0];

      const { likesCount, dislikesCount } = comment.likesInfo;

      return [likesCount ?? 0, dislikesCount ?? 0];
    } catch (e: unknown) {
      console.error(e);
      return [0, 0];
    }
  }

  async updateLikes(commentId: string, newLikesCount: [number, number]) {
    const comment = await CommentModel.findById(commentId);

    if (comment === null) return;

    comment.likesInfo = {
      likesCount: newLikesCount[0],
      dislikesCount: newLikesCount[1],
    };
    await comment.save();
  }
}
