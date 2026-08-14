import { ELikeStatus, LikeModel } from "./like.model";

export class LikesRepository {
  constructor() {}

  async setLike(userId: string, commentId: string, likeStatus: ELikeStatus) {
    const likeModel = await LikeModel.findOne({ userId, commentId });

    if (likeModel === null) {
      const newLikeModel = new LikeModel({ userId, commentId, likeStatus });
      await newLikeModel.save();
    } else {
      likeModel.likeStatus = likeStatus;
      await likeModel.save();
    }
  }

  async getLike(userId: string, commentId: string) {
    return await LikeModel.findOne({
      userId,
      commentId,
    }).lean();
  }

  async getCommentLikesCount(commentId: string) {
    const result = await LikeModel.countDocuments({
      commentId,
      likeStatus: ELikeStatus.Like,
    });

    return result;
  }

  async getCommentDislikesCount(commentId: string) {
    const result = await LikeModel.countDocuments({
      commentId,
      likeStatus: ELikeStatus.Dislike,
    });

    return result;
  }

  async getUsersLikes(userId: string) {
    const result = await LikeModel.find({ userId }).lean();

    return result;
  }
}
