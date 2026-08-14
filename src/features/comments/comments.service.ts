import { injectable, inject } from "inversify";
import { PostsService } from "../posts/services/posts.service";
import { UsersService } from "../users/users.service";
import {
  ICommentCreateModel,
  IDBCommentType,
  IFindCommentsSearchTerm,
  ICommentView,
  ICommentType,
  GetCommentsResponse,
} from "./comments.types";
import { CommentsRepository } from "./comments.repository";
import { LikesRepository } from "../likes/likes.repository";
import { ELikeStatus } from "../likes/like.model";

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
    likesInfo: {
      likesCount: dbComment?.likesInfo?.likesCount ?? 0,
      dislikesCount: dbComment?.likesInfo?.dislikesCount ?? 0,
    },
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

@injectable()
export class CommentsService {
  constructor(
    @inject(CommentsRepository)
    private commentsRepository: CommentsRepository,
    @inject(PostsService)
    private postsService: PostsService,
    @inject(UsersService)
    private usersService: UsersService,
    @inject(LikesRepository)
    private likesRepository: LikesRepository,
  ) {}

  async getCommentById(id: string, userId?: string | null) {
    const dbComment = await this.commentsRepository.getCommentById(id);
    if (!dbComment) return null;

    const result = mapDbCommentToView(dbComment);
    if (userId) {
      const userLike = await this.likesRepository.getLike(userId, id);
      const userLikeStatus = userLike?.likeStatus;

      if (result.likesInfo) {
        result.likesInfo.myStatus = userLikeStatus || ELikeStatus.None;
      }
    }

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
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
      },
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
