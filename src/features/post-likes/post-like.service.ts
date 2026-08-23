import { inject, injectable } from "inversify";
import { ILikeStatusPutBody } from "../comments/comments.types";
import { UsersRepository } from "../users/users.repository";
import { CommentsRepository } from "../comments/comments.repository";
import { PostLikeRepository } from "./post-like.repository";
import { CommentsService } from "../comments/comments.service";
import { EPostLikeStatus, PostLike } from "./post-like.model";

@injectable()
export class PostLikeService {
  constructor(
    @inject(PostLikeRepository)
    private postLikeRepository: PostLikeRepository,
  ) {}

  async set({
    userId,
    postId,
    postLikeStatus,
  }: {
    userId: string;
    postId: string;
    postLikeStatus: EPostLikeStatus;
  }) {
    const postLike = await PostLike.findOne({ userId, postId });

    if (postLike) {
      postLike.postLikeStatus = postLikeStatus;
      await this.postLikeRepository.save(postLike);
    } else {
      const newPostLike = new PostLike({
        userId,
        postId,
        postLikeStatus,
      });
      await this.postLikeRepository.save(newPostLike);
    }
  }
}
