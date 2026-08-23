import { User } from "../users/models/user.model";
import {
  EPostLikeStatus,
  IPostLikeType,
  PostLike,
  PostLikeType,
} from "./post-like.model";
import { IExtendedLikesInfo } from "./post-like.types";

// TODO:: add to composition root
export class PostLikeRepository {
  async save(postLike: PostLikeType) {
    await postLike.save();
  }

  // TODO:: move to service
  async getLikesInfo({
    userId,
    postId,
  }: {
    userId?: string | undefined;
    postId: string;
  }): Promise<IExtendedLikesInfo> {
    const likesCount = await PostLike.countDocuments({
      postId,
      postLikeStatus: EPostLikeStatus.Like,
    });
    const dislikesCount = await PostLike.countDocuments({
      postId,
      postLikeStatus: EPostLikeStatus.Dislike,
    });

    const userLike = userId ? await PostLike.findOne({ userId, postId }) : null;
    const myStatus = userLike?.postLikeStatus ?? EPostLikeStatus.None;

    let rawNewestLikes = await PostLike.find({
      postId,
      postLikeStatus: EPostLikeStatus.Like,
    })
      .sort({ updatedAt: -1 })
      .limit(3);

    const newestLikes = await Promise.all(
      rawNewestLikes.map(async (l) => {
        const user = await User.findOne({ _id: l.userId });
        if (!user) {
          throw "some user not found";
        }

        return {
          userId: l.userId,
          login: user.login,
          addedAt: l.updatedAt || l.createdAt,
        };
      }),
    );

    return {
      likesCount,
      dislikesCount,
      myStatus,
      newestLikes,
    };
  }
}
