import { inject, injectable } from "inversify";
import { ILikeStatusPutBody } from "../comments/comments.types";
import { UsersRepository } from "../users/users.repository";
import { CommentsRepository } from "../comments/comments.repository";
import { ELikeStatus } from "./like.model";
import { LikesRepository } from "./likes.repository";
import { CommentsService } from "../comments/comments.service";

@injectable()
export class LikeService {
  constructor(
    @inject(CommentsRepository)
    private commentsRepository: CommentsRepository,
    @inject(LikesRepository)
    private likesRepository: LikesRepository,
  ) {}

  async isCommentExist(commentId: string): Promise<boolean> {
    const comment = await this.commentsRepository.getCommentById(commentId);

    return comment !== null;
  }

  async updateLike({
    userId,
    commentId,
    likeStatus: newLikeStatus,
  }: ILikeStatusPutBody & { userId: string }) {
    const [likesCount, dislikesCount] =
      await this.commentsRepository.getLikesCount(commentId);

    const userLike = await this.likesRepository.getLike(userId, commentId);
    const oldLikeStatus = userLike?.likeStatus;

    if (oldLikeStatus === newLikeStatus) {
      return;
    }

    await this.likesRepository.setLike(userId, commentId, newLikeStatus);

    const newLikesCount =
      await this.likesRepository.getCommentLikesCount(commentId);
    const newDislikesCount =
      await this.likesRepository.getCommentDislikesCount(commentId);

    await this.commentsRepository.updateLikes(commentId, [
      newLikesCount,
      newDislikesCount,
    ]);

    // тут проблема с обновлением, какое было сотс
  }
}
