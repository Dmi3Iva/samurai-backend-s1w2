import { PostsService } from "../posts/services/posts.service";
import { UsersService } from "../users/users.service";
import {
  ICommentCreateModel,
  IDBCommentType,
  IFindCommentsSearchTerm,
  ICommentView,
  ICommentType,
  GetCommentsResponse,
} from "./comments.models";
import { CommentsRepository } from "./comments.repository";

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

export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private postsService: PostsService,
    private usersService: UsersService,
  ) {}

  async getCommentById(id: string) {
    const dbComment = await this.commentsRepository.getCommentById(id);
    if (!dbComment) return null;

    const result = mapDbCommentToView(dbComment);

    return result;
  }
  async createComment({
    postId,
    content,
    userId,
  }: {
    postId: string;
    content: string;
    userId: string;
  }): Promise<ICommentView | null> {
    const user = await this.usersService.getUserById(userId);

    const commentModel: ICommentCreateModel = {
      content: content,
      createdAt: new Date(),
      commentatorInfo: {
        userId,
        userLogin: user?.login ?? "",
      },
      postId,
    };
    const idResult = await this.commentsRepository.createComment(commentModel);
    if (!idResult) return null;

    const result: ICommentView = {
      id: idResult,
      commentatorInfo: {
        userLogin: commentModel.commentatorInfo.userLogin,
        userId: commentModel.commentatorInfo.userId,
      },
      createdAt: commentModel.createdAt,
      content: content,
    };

    return result;
  }
  async removeById(id: string, userId: string): Promise<ERemoveUserState> {
    const dbComment = await this.commentsRepository.getCommentById(id);
    if (!dbComment) return ERemoveUserState.FAILED;
    if (dbComment.commentatorInfo.userId !== userId)
      return ERemoveUserState.NOT_ALLOWED;

    const removeResult = await this.commentsRepository.removeById(id);
    return removeResult ? ERemoveUserState.SUCESS : ERemoveUserState.FAILED;
  }

  async getComments(
    postId: string,
    query: IFindCommentsSearchTerm,
  ): Promise<GetCommentsResponse | null> {
    const isPostExists = await this.postsService.getPost(postId);
    if (!isPostExists) {
      return null;
    }

    const comments = await this.commentsRepository.getComments(query, postId);

    return comments;
  }
  async updateComment({
    commentId,
    content,
    userId,
  }: {
    commentId: string;
    content: string;
    userId: string;
  }): Promise<ERemoveUserState> {
    const comment = await this.getCommentById(commentId);

    if (!comment) {
      return ERemoveUserState.FAILED;
    }

    if (comment.commentatorInfo.userId !== userId) {
      return ERemoveUserState.NOT_ALLOWED;
    }

    const updatedCommentData = {
      content,
    };

    const result = await this.commentsRepository.updateComment({
      commentId,
      updatedCommentData,
    });

    return result ? ERemoveUserState.SUCESS : ERemoveUserState.FAILED;
  }
}
