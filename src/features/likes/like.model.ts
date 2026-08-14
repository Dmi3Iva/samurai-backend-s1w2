import { KeyObject } from "crypto";
import { model, Schema } from "mongoose";

export enum ELikeStatus {
  None = "None",
  Like = "Like",
  Dislike = "Dislike",
}

export const LIKE_VALUES = [
  ELikeStatus.None,
  ELikeStatus.Like,
  ELikeStatus.Dislike,
];

export interface ILikeType {
  userId: string;
  commentId: string;
  likeStatus: ELikeStatus;
}

const LikeSchema = new Schema<ILikeType>({
  userId: { type: String, required: true },
  commentId: { type: String, required: true },
  likeStatus: {
    type: String,
    enum: LIKE_VALUES,
    default: ELikeStatus.None,
    required: true,
  },
});

export const LikeModel = model("like", LikeSchema);
