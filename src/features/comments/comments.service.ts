import { postsService } from "../posts/services/posts.service";
import { usersService } from "../users/users.service";
import {
  ICommentCreateModel,
  IDBCommentType,
  IFindCommentsSearchTerm,
  ICommentView,
  ICommentType,
  GetCommentsResponse,
} from "./comments.models";
import { commentsRepository } from "./comments.repository";

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

export enum ERemoveUserState {
  SUCESS,
  /**
   * try to delete not your comment
   */
  NOT_ALLOWED,
  FAILED,
}

export const commentsService = {
  async getCommentById(id: string) {
    const dbComment = await commentsRepository.getCommentById(id);
    if (!dbComment) return null;

    const result = mapDbCommentToView(dbComment);

    return result;
  },
  async createComment({
    postId,
    content,
    userId,
  }: {
    postId: string;
    content: string;
    userId: string;
  }) {
    const user = await usersService.getUserById(userId);

    const commentModel: ICommentCreateModel = {
      content: content,
      createdAt: new Date(),
      commentatorInfo: {
        userId,
        userLogin: user?.login ?? "",
      },
      postId,
    };
    const idResult = await commentsRepository.createComment(commentModel);

    const result = { ...commentModel, id: idResult };

    return result;
  },
  async removeById(id: string, userId: string): Promise<ERemoveUserState> {
    const dbComment = await commentsRepository.getCommentById(id);
    if (!dbComment) return ERemoveUserState.FAILED;
    if (dbComment.commentatorInfo.userId !== userId)
      return ERemoveUserState.NOT_ALLOWED;

    const removeResult = await commentsRepository.removeById(id);
    return removeResult ? ERemoveUserState.SUCESS : ERemoveUserState.FAILED;
  },

  async getComments(
    postId: string,
    query: IFindCommentsSearchTerm,
  ): Promise<GetCommentsResponse | null> {
    const isPostExists = await postsService.getPost(postId);
    if (!isPostExists) {
      return null;
    }

    const comments = await commentsRepository.getComments(query, postId);

    return comments;
  },
  async updateComment({
    commentId,
    content,
    userId,
  }: {
    commentId: string;
    content: string;
    userId: string;
  }): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    if (!comment || comment.commentatorInfo.userId !== userId) {
      return false;
    }

    const updatedCommentData = {
      content,
    };

    const result = await commentsRepository.updateComment({
      commentId,
      updatedCommentData,
    });

    return result;
  },
};
